// 헤르메스 — PM 다이제스트 에이전트 (GitHub Actions cron에서 실행).
// GitHub(PR/이슈/CI)를 수집 → Claude(claude-haiku-4-5)로 요약 → Slack 게시.
// 의존성 없음 (Node 22 내장 fetch 사용). 키 미설정 시 안전하게 skip.
//
// 환경변수:
//   GITHUB_TOKEN, GITHUB_REPOSITORY (Actions 자동 제공)
//   GMS_KEY (필수 — 사내 GMS 프록시 키. 없으면 ANTHROPIC_API_KEY 폴백, 둘 다 없으면 요약 skip)
//   LLM_BASE_URL (선택, 기본 https://gms.ssafy.io/gmsapi/api.anthropic.com/v1/messages)
//   SLACK_WEBHOOK_URL (필수 — 없으면 콘솔 출력)
//   HERMES_MODEL (선택, 기본 claude-sonnet-4-6)

const GH_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY; // "owner/name"
// 사내 GMS 프록시(Anthropic Messages 호환) 키 우선, 없으면 공개 Anthropic 키로 폴백.
const LLM_KEY = process.env.GMS_KEY || process.env.ANTHROPIC_API_KEY;
const LLM_URL =
  process.env.LLM_BASE_URL ||
  "https://gms.ssafy.io/gmsapi/api.anthropic.com/v1/messages";
const SLACK_URL = process.env.SLACK_WEBHOOK_URL;
const MODEL = process.env.HERMES_MODEL || "claude-sonnet-4-6";

const SINCE = new Date(Date.now() - 24 * 60 * 60 * 1000); // 최근 24시간

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
    draft: p.draft,
    // 이슈키(예: INS-12) 누락 여부 — Jira 연동 보조
    hasIssueKey: /[A-Z]{2,}-\d+/.test(p.title) || /[A-Z]{2,}-\d+/.test(p.head?.ref || ""),
  }));

  const failedRuns = (runs.workflow_runs || [])
    .filter((r) => r.conclusion === "failure" && new Date(r.created_at) >= SINCE)
    .map((r) => ({ name: r.name, branch: r.head_branch, url: r.html_url }));

  return { mergedRecently, open, failedRuns };
}

async function summarize(data) {
  if (!LLM_KEY) {
    return null;
  }
  const prompt = `너는 InSeoul 2인 개발팀의 PM 어시스턴트 "헤르메스"다.
아래 GitHub 데이터를 바탕으로 한국어 일일 다이제스트를 간결하게 작성해라.
- 어제 머지된 PR 요약
- 현재 열린 PR (이슈키 없는 PR은 "⚠️ 이슈키 누락"으로 표시)
- 실패한 CI가 있으면 블로커로 강조
- 마지막에 오늘의 권장 액션 1~2줄
불필요한 머리말 없이 바로 본문만. 슬랙 메시지용으로 짧게.

데이터(JSON):
${JSON.stringify(data, null, 2)}`;

  const res = await fetch(LLM_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": LLM_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic → ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return (json.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

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

async function main() {
  if (!GH_TOKEN || !REPO) {
    console.error("GITHUB_TOKEN / GITHUB_REPOSITORY 필요");
    process.exit(1);
  }
  const data = await collect();

  let body = await summarize(data);
  if (!body) {
    // LLM 키(GMS_KEY) 없을 때 fallback: 기계 생성 요약
    const merged = data.mergedRecently.map((p) => `• #${p.number} ${p.title}`).join("\n") || "• 없음";
    const open = data.open
      .map((p) => `• #${p.number} ${p.title}${p.hasIssueKey ? "" : " ⚠️ 이슈키 누락"}`)
      .join("\n") || "• 없음";
    const fails = data.failedRuns.map((r) => `• ${r.name} (${r.branch})`).join("\n") || "• 없음";
    body = `*(GMS_KEY 미설정 — 기계 요약)*\n*머지된 PR*\n${merged}\n*열린 PR*\n${open}\n*CI 실패*\n${fails}`;
  }

  const header = `:newspaper: *InSeoul 일일 다이제스트* — ${new Date().toISOString().slice(0, 10)}`;
  await postSlack(`${header}\n${body}`);
  console.log("헤르메스 다이제스트 게시 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
