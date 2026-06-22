// 헤르메스 — PM 다이제스트 + Jira 블로커 자동 생성 (GitHub Actions cron에서 실행).
// GitHub(PR/이슈/CI) 수집 → GMS 프록시(Anthropic 호환)로 요약 → Slack 게시.
// 결정적 규칙 A: main CI가 "현재" 실패면 Jira 블로커 이슈 생성(중복 방지).
// 의존성 없음 (Node 22 내장 fetch). 키 미설정 시 안전하게 skip.
//
// 환경변수:
//   GITHUB_TOKEN, GITHUB_REPOSITORY (Actions 자동 제공)
//   GMS_KEY (요약용 — 없으면 ANTHROPIC_API_KEY 폴백, 둘 다 없으면 기계 요약)
//   LLM_BASE_URL (선택, 기본 SSAFY GMS 프록시)
//   SLACK_WEBHOOK_URL (게시 — 없으면 콘솔 출력)
//   HERMES_MODEL (선택, 기본 claude-sonnet-4-6)
//   JIRA_BASE_URL, JIRA_USER_EMAIL, JIRA_API_TOKEN (Jira 쓰기 — 셋 다 있어야 활성)
//   JIRA_PROJECT_KEY (선택, 기본 NSLPRJCT), JIRA_ISSUE_TYPE (선택, 기본 Task)
//   HERMES_FORCE_CI_ISSUE=true (검증용: CI 정상이어도 테스트 이슈 1개 생성)

const GH_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY; // "owner/name"
const REPO_URL = `https://github.com/${REPO}`;

const LLM_KEY = process.env.GMS_KEY || process.env.ANTHROPIC_API_KEY;
const LLM_URL =
  process.env.LLM_BASE_URL ||
  "https://gms.ssafy.io/gmsapi/api.anthropic.com/v1/messages";
const MODEL = process.env.HERMES_MODEL || "claude-sonnet-4-6";

const SLACK_URL = process.env.SLACK_WEBHOOK_URL;

const JIRA_BASE = (process.env.JIRA_BASE_URL || "").replace(/\/+$/, "");
const JIRA_EMAIL = process.env.JIRA_USER_EMAIL;
const JIRA_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT = process.env.JIRA_PROJECT_KEY || "NSLPRJCT";
const JIRA_TYPE = process.env.JIRA_ISSUE_TYPE || "Task";
const JIRA_ENABLED = Boolean(JIRA_BASE && JIRA_EMAIL && JIRA_TOKEN);

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
  // "현재" main CI 상태 = 가장 최근 main CI 런 (24h 내 옛 실패가 아니라 최신 상태)
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

// ───────── LLM 요약 (GMS 프록시, Anthropic 호환) ─────────

async function summarize(data) {
  if (!LLM_KEY) return null;
  const prompt = `너는 InSeoul 2인 개발팀의 PM 어시스턴트 "헤르메스"다.
아래 데이터로 한국어 일일 다이제스트를 간결하게 작성해라.
- 어제 머지된 PR 요약
- 현재 열린 PR (hasIssueKey=false 면 "⚠️ 이슈키 누락"으로 표시)
- CI 블로커: **mainCi.failing 이 true 일 때만** 강조하라. false면 "main CI 정상"이라고만 적어라(과거 실패 언급 금지).
- 마지막에 오늘의 권장 액션 1~2줄
머리말 없이 본문만. 슬랙 메시지용으로 짧게.

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

// ───────── Jira (REST v3, Basic auth) ─────────

function jiraAuth() {
  return "Basic " + Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString("base64");
}

async function jira(path, method = "GET", body) {
  const res = await fetch(`${JIRA_BASE}${path}`, {
    method,
    headers: { Authorization: jiraAuth(), "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Jira ${method} ${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

// ADF (Atlassian Document Format) — v3 description은 plain string 불가
function adf(text) {
  return {
    type: "doc",
    version: 1,
    content: text.split("\n").map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : [],
    })),
  };
}

async function searchIssueKey(jql) {
  const payload = { jql, maxResults: 1, fields: ["key"] };
  try {
    const r = await jira("/rest/api/3/search", "POST", payload); // classic
    return r.issues?.[0]?.key ?? null;
  } catch {
    const r = await jira("/rest/api/3/search/jql", "POST", payload); // enhanced
    return r.issues?.[0]?.key ?? null;
  }
}

async function createIssue(summary, description, labels) {
  // 프로젝트 언어/유형에 따라 이름이 다를 수 있어 후보를 순차 시도(issuetype 오류 때만 다음으로).
  const candidates = [...new Set([JIRA_TYPE, "Task", "작업", "Story", "스토리", "Bug", "버그"])];
  let lastErr;
  for (const name of candidates) {
    try {
      const r = await jira("/rest/api/3/issue", "POST", {
        fields: { project: { key: JIRA_PROJECT }, summary, issuetype: { name }, description, labels },
      });
      return r.key;
    } catch (e) {
      lastErr = e;
      if (!/issuetype|issue type/i.test(e.message)) throw e; // issuetype 외 오류는 즉시 중단
    }
  }
  throw lastErr;
}

async function handleJira(data) {
  if (!JIRA_ENABLED) return "";
  try {
    if (FORCE_CI_ISSUE) {
      const key = await createIssue(
        "[TEST] 헤르메스 Jira 쓰기 검증",
        adf("헤르메스가 Jira에 이슈를 생성할 수 있는지 확인하는 테스트입니다. 확인 후 닫아도 됩니다.\n(label: hermes-test)"),
        ["hermes-test"],
      );
      return `\n:white_check_mark: Jira 테스트 이슈 생성: <${JIRA_BASE}/browse/${key}|${key}>`;
    }
    if (!data.mainCi.failing) return "";
    // 중복 방지: 열린 ci-blocker 이슈가 이미 있으면 재생성 안 함
    const jql = `project = ${JIRA_PROJECT} AND labels = ci-blocker AND statusCategory != Done ORDER BY created DESC`;
    const existing = await searchIssueKey(jql);
    if (existing) {
      console.log(`이미 열린 CI 블로커 이슈: ${existing}`);
      return `\n:jira: 기존 CI 블로커 이슈: <${JIRA_BASE}/browse/${existing}|${existing}>`;
    }
    const ci = data.mainCi;
    const key = await createIssue(
      `🚨 main CI 실패: ${ci.name} (run #${ci.runNumber})`,
      adf(`main 브랜치 CI가 실패했습니다.\n워크플로: ${ci.name}\n브랜치: ${ci.branch}\n링크: ${ci.url}\n\n머지 전 수정 필요. (헤르메스 자동 생성, label: ci-blocker)`),
      ["ci-blocker"],
    );
    return `\n:rotating_light: Jira 블로커 이슈 생성: <${JIRA_BASE}/browse/${key}|${key}>`;
  } catch (e) {
    console.error("Jira 처리 실패:", e.message);
    return `\n:warning: Jira 이슈 처리 실패 (Actions 로그 확인)`;
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

  const header = `:newspaper: *InSeoul 일일 다이제스트* — ${new Date().toISOString().slice(0, 10)}`;
  await postSlack(`${header}\n${body}${jiraNote}`);
  console.log("헤르메스 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
