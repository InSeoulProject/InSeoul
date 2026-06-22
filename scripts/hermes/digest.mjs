// 헤르메스 — PM 다이제스트 + Jira 블로커 자동 생성 + 개인별 업무 배정 (GitHub Actions cron).
// GitHub(PR/이슈/CI) 수집 → GMS 프록시(Anthropic 호환)로 요약 → Slack 게시.
// 자율성 C: 상태 신호(CI 실패)→블로커 생성은 자동, 생성/배정은 라벨로 흔적 남김.
// 의존성 없음 (Node 22 내장 fetch). 키 미설정 시 해당 기능만 안전하게 skip.
//
// 환경변수:
//   GITHUB_TOKEN, GITHUB_REPOSITORY (Actions 자동 제공)
//   GMS_KEY (요약 — 없으면 ANTHROPIC_API_KEY 폴백, 둘 다 없으면 기계 요약)
//   LLM_BASE_URL (선택, 기본 SSAFY GMS 프록시), HERMES_MODEL (기본 claude-sonnet-4-6)
//   SLACK_WEBHOOK_URL (게시 — 없으면 콘솔 출력)
//   JIRA_BASE_URL/USER_EMAIL/API_TOKEN (Jira 활성), JIRA_PROJECT_KEY (기본 NSLPRJCT)
//   HERMES_FORCE_CI_ISSUE=true (검증용 테스트 이슈 생성)

import team from "./team.json" with { type: "json" };
import {
  JIRA_ENABLED,
  JIRA_BASE,
  JIRA_PROJECT,
  searchIssueKey,
  searchIssues,
  createIssue,
  resolveAccountId,
} from "./jira.mjs";

const GH_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY; // "owner/name"

const LLM_KEY = process.env.GMS_KEY || process.env.ANTHROPIC_API_KEY;
const LLM_URL =
  process.env.LLM_BASE_URL ||
  "https://gms.ssafy.io/gmsapi/api.anthropic.com/v1/messages";
const MODEL = process.env.HERMES_MODEL || "claude-sonnet-4-6";

const SLACK_URL = process.env.SLACK_WEBHOOK_URL;
const FORCE_CI_ISSUE = process.env.HERMES_FORCE_CI_ISSUE === "true";
const SINCE = new Date(Date.now() - 24 * 60 * 60 * 1000);

// ───────── GitHub ─────────

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) throw new Error(`GitHub ${path} → ${res.status}`);
  return res.json();
}

async function collect() {
  const [closedPRs, openPRs, runs] = await Promise.all([
    gh(`/repos/${REPO}/pulls?state=closed&sort=updated&direction=desc&per_page=30`),
    gh(`/repos/${REPO}/pulls?state=open&sort=updated&direction=desc&per_page=30`),
    gh(`/repos/${REPO}/actions/runs?per_page=30`),
  ]);

  const mergedRecently = closedPRs
    .filter((p) => p.merged_at && new Date(p.merged_at) >= SINCE)
    .map((p) => ({ number: p.number, title: p.title, user: p.user?.login }));

  const open = openPRs.map((p) => ({
    number: p.number,
    title: p.title,
    user: p.user?.login,
    hasIssueKey: /[A-Z]{2,}-\d+/.test(p.title) || /[A-Z]{2,}-\d+/.test(p.head?.ref || ""),
  }));

  const ciRuns = (runs.workflow_runs || []).filter((r) => r.name === "CI");
  const latest = ciRuns.find((r) => r.head_branch === "main");
  const mainCi = latest
    ? {
        failing: latest.status === "completed" && latest.conclusion === "failure",
        name: latest.name,
        branch: latest.head_branch,
        url: latest.html_url,
        runNumber: latest.run_number,
        state: latest.conclusion || latest.status,
      }
    : { failing: false, state: "none" };

  return { mergedRecently, open, mainCi };
}

// ───────── LLM 요약 (GMS 프록시) ─────────

async function summarize(data) {
  if (!LLM_KEY) return null;
  const prompt = `너는 InSeoul 2인 개발팀의 PM 어시스턴트 "헤르메스"다.
아래 데이터로 한국어 일일 다이제스트를 간결하게 작성해라.
- 어제 머지된 PR 요약
- 현재 열린 PR (hasIssueKey=false 면 "⚠️ 이슈키 누락")
- CI 블로커: mainCi.failing 이 true 일 때만 강조. false면 "main CI 정상"이라고만(과거 실패 언급 금지).
- 마지막에 오늘의 권장 액션 1~2줄
머리말 없이 본문만. 슬랙용으로 짧게.

데이터(JSON):
${JSON.stringify(data, null, 2)}`;

  const res = await fetch(LLM_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": LLM_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 1024, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`LLM → ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return (json.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

function machineFallback(data) {
  const merged = data.mergedRecently.map((p) => `• #${p.number} ${p.title}`).join("\n") || "• 없음";
  const open = data.open.map((p) => `• #${p.number} ${p.title}${p.hasIssueKey ? "" : " ⚠️ 이슈키 누락"}`).join("\n") || "• 없음";
  const ci = data.mainCi.failing ? `🚨 실패 — ${data.mainCi.name} (run #${data.mainCi.runNumber})` : "정상";
  return `*(GMS_KEY 미설정 — 기계 요약)*\n*머지된 PR*\n${merged}\n*열린 PR*\n${open}\n*main CI*\n${ci}`;
}

// ───────── Jira 블로커 (규칙 A) ─────────

async function handleJira(data) {
  if (!JIRA_ENABLED) return "";
  try {
    if (FORCE_CI_ISSUE) {
      const key = await createIssue({
        summary: "[TEST] 헤르메스 Jira 쓰기 검증",
        description: "헤르메스가 Jira에 이슈를 생성할 수 있는지 확인하는 테스트입니다. 확인 후 닫아도 됩니다.\n(label: hermes-test)",
        labels: ["hermes-test"],
      });
      return `\n:white_check_mark: Jira 테스트 이슈 생성: <${JIRA_BASE}/browse/${key}|${key}>`;
    }
    if (!data.mainCi.failing) return "";
    const existing = await searchIssueKey(
      `project = ${JIRA_PROJECT} AND labels = ci-blocker AND statusCategory != Done ORDER BY created DESC`,
    );
    if (existing) return `\n:jira: 기존 CI 블로커 이슈: <${JIRA_BASE}/browse/${existing}|${existing}>`;
    const ci = data.mainCi;
    const key = await createIssue({
      summary: `🚨 main CI 실패: ${ci.name} (run #${ci.runNumber})`,
      description: `main 브랜치 CI가 실패했습니다.\n워크플로: ${ci.name}\n브랜치: ${ci.branch}\n링크: ${ci.url}\n\n머지 전 수정 필요. (헤르메스 자동 생성, label: ci-blocker)`,
      labels: ["ci-blocker"],
    });
    return `\n:rotating_light: Jira 블로커 이슈 생성: <${JIRA_BASE}/browse/${key}|${key}>`;
  } catch (e) {
    console.error("Jira 블로커 처리 실패:", e.message);
    return `\n:warning: Jira 블로커 처리 실패 (Actions 로그 확인)`;
  }
}

// ───────── 개인별 업무 배정 다이제스트 (L1) ─────────

async function assignmentDigest() {
  if (!JIRA_ENABLED) return "";
  if (!team.members.some((m) => m.jiraEmail)) return ""; // 이메일 없으면 skip
  try {
    const sections = [];
    for (const m of team.members) {
      const mention = m.slackMemberId ? `<@${m.slackMemberId}>` : `*${m.name}*`;
      const acc = m.jiraEmail ? await resolveAccountId(m.jiraEmail).catch(() => null) : null;
      if (!acc) {
        sections.push(`${mention}: (Jira 계정 미설정)`);
        continue;
      }
      const issues = await searchIssues(
        `project = ${JIRA_PROJECT} AND assignee = "${acc}" AND statusCategory != Done ORDER BY status, created`,
        ["key", "summary", "status"],
        20,
      );
      if (!issues.length) {
        sections.push(`${mention}: 진행 중 작업 없음`);
        continue;
      }
      const list = issues
        .map((i) => `   • ${i.key} ${i.fields.summary} _(${i.fields.status?.name || "?"})_`)
        .join("\n");
      sections.push(`${mention} — ${issues.length}건\n${list}`);
    }
    return `\n\n:clipboard: *오늘의 업무 배정*\n${sections.join("\n")}`;
  } catch (e) {
    console.error("배정 다이제스트 실패:", e.message);
    return "";
  }
}

// ───────── Slack ─────────

async function postSlack(text) {
  if (!SLACK_URL) {
    console.log("SLACK_WEBHOOK_URL 미설정 — 콘솔 출력:\n" + text);
    return;
  }
  const res = await fetch(SLACK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Slack → ${res.status}`);
}

// ───────── main ─────────

async function main() {
  if (!GH_TOKEN || !REPO) {
    console.error("GITHUB_TOKEN / GITHUB_REPOSITORY 필요");
    process.exit(1);
  }
  const data = await collect();
  const body = (await summarize(data)) || machineFallback(data);
  const jiraNote = await handleJira(data);
  const assign = await assignmentDigest();

  const header = `:newspaper: *InSeoul 일일 다이제스트* — ${new Date().toISOString().slice(0, 10)}`;
  await postSlack(`${header}\n${body}${jiraNote}${assign}`);
  console.log("헤르메스 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
