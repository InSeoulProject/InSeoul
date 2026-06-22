// 공유 Jira 클라이언트 (REST v3, Basic auth). Node 22 내장 fetch/Buffer.
// 자격증명은 환경변수에서 호출 시점에 읽음 — 셋 다 없으면 JIRA_ENABLED=false.

const BASE = (process.env.JIRA_BASE_URL || "").replace(/\/+$/, "");
const EMAIL = process.env.JIRA_USER_EMAIL;
const TOKEN = process.env.JIRA_API_TOKEN;

export const JIRA_BASE = BASE;
export const JIRA_PROJECT = process.env.JIRA_PROJECT_KEY || "NSLPRJCT";
export const JIRA_ENABLED = Boolean(BASE && EMAIL && TOKEN);

function authHeader() {
  return "Basic " + Buffer.from(`${EMAIL}:${TOKEN}`).toString("base64");
}

export async function jira(path, method = "GET", body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Jira ${method} ${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

// ADF (Atlassian Document Format) — v3 description은 plain string 불가
export function adf(text) {
  return {
    type: "doc",
    version: 1,
    content: String(text)
      .split("\n")
      .map((line) => ({
        type: "paragraph",
        content: line ? [{ type: "text", text: line }] : [],
      })),
  };
}

// classic → enhanced 폴백
export async function searchIssues(jql, fields = ["key", "summary", "status"], maxResults = 50) {
  const payload = { jql, maxResults, fields };
  try {
    const r = await jira("/rest/api/3/search", "POST", payload);
    return r.issues || [];
  } catch {
    const r = await jira("/rest/api/3/search/jql", "POST", payload);
    return r.issues || [];
  }
}

export async function searchIssueKey(jql) {
  const issues = await searchIssues(jql, ["key"], 1);
  return issues[0]?.key ?? null;
}

export async function resolveAccountId(email) {
  if (!email) return null;
  const users = await jira(`/rest/api/3/user/search?query=${encodeURIComponent(email)}`);
  const match =
    users.find((u) => (u.emailAddress || "").toLowerCase() === email.toLowerCase()) || users[0];
  return match?.accountId || null;
}

// issuetype 이름은 프로젝트 언어/구성에 따라 달라 후보를 순차 시도(issuetype 오류 때만 다음).
// issueTypes 배열을 주면 그 후보만 사용(Epic은 ["Epic","에픽"], Task는 ["Task","작업"...]).
export async function createIssue({
  summary,
  description,
  labels = [],
  assigneeAccountId = null,
  parentKey = null,
  issueTypes,
}) {
  const candidates = [
    ...new Set(
      (issueTypes && issueTypes.length
        ? issueTypes
        : [process.env.JIRA_ISSUE_TYPE, "Task", "작업", "Story", "스토리"]
      ).filter(Boolean),
    ),
  ];
  let lastErr;
  for (const name of candidates) {
    const fields = {
      project: { key: JIRA_PROJECT },
      summary,
      issuetype: { name },
      description: typeof description === "string" ? adf(description) : description,
    };
    if (labels.length) fields.labels = labels;
    if (assigneeAccountId) fields.assignee = { accountId: assigneeAccountId };
    if (parentKey) fields.parent = { key: parentKey };
    try {
      const r = await jira("/rest/api/3/issue", "POST", { fields });
      return r.key;
    } catch (e) {
      lastErr = e;
      if (!/issuetype|issue type/i.test(e.message)) throw e;
    }
  }
  throw lastErr;
}

export async function transitionIssue(key, statusName) {
  const { transitions } = await jira(`/rest/api/3/issue/${key}/transitions`);
  const t = (transitions || []).find(
    (x) => x.name === statusName || x.to?.name === statusName,
  );
  if (!t) throw new Error(`전환 '${statusName}' 없음 (가능: ${(transitions || []).map((x) => x.name).join(", ")})`);
  await jira(`/rest/api/3/issue/${key}/transitions`, "POST", { transition: { id: t.id } });
  return t.to?.name || statusName;
}
