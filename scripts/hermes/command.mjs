// 헤르메스 명령 처리 — Slack /hermes 요청을 LLM tool-use로 수행 (Jira 생성/배정/전환/검색).
// repository_dispatch(type: hermes-command)로 트리거되며, client_payload를 GITHUB_EVENT_PATH에서 읽는다.
// 결과는 Slack response_url로 회신.
//
// 환경변수: GMS_KEY(또는 ANTHROPIC_API_KEY), LLM_BASE_URL, HERMES_MODEL,
//           JIRA_BASE_URL/USER_EMAIL/API_TOKEN, JIRA_PROJECT_KEY

import fs from "node:fs";
import team from "./team.json" with { type: "json" };
import {
  JIRA_ENABLED,
  JIRA_PROJECT,
  JIRA_BASE,
  jira,
  searchIssues,
  createIssue,
  resolveAccountId,
  transitionIssue,
} from "./jira.mjs";

const LLM_KEY = process.env.GMS_KEY || process.env.ANTHROPIC_API_KEY;
const LLM_URL =
  process.env.LLM_BASE_URL ||
  "https://gms.ssafy.io/gmsapi/api.anthropic.com/v1/messages";
const MODEL = process.env.HERMES_MODEL || "claude-sonnet-4-6";

const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const payload = event.client_payload || {};
const userText = (payload.text || "").trim();
const responseUrl = payload.response_url;
const requester = payload.user_name || payload.user || "";

async function slackReply(text) {
  const body = { response_type: "in_channel", text: `:robot_face: *헤르메스*\n${text}` };
  if (responseUrl) {
    await fetch(responseUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } else {
    console.log(body.text);
  }
}

function memberByName(name) {
  if (!name) return null;
  return (
    team.members.find(
      (m) => m.name === name || name.includes(m.name) || m.name.includes(name) || m.githubLogin === name,
    ) || null
  );
}

async function accountFor(name) {
  const m = memberByName(name);
  if (!m?.jiraEmail) return null;
  return resolveAccountId(m.jiraEmail).catch(() => null);
}

const tools = [
  {
    name: "search_issues",
    description: "Jira 이슈를 JQL로 검색. 예: 'project=KEY AND assignee=\"...\" AND statusCategory != Done'",
    input_schema: { type: "object", properties: { jql: { type: "string" } }, required: ["jql"] },
  },
  {
    name: "create_issue",
    description: "새 Jira 작업 티켓 생성. assignee_name으로 담당자 지정(생략 시 미배정).",
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        description: { type: "string" },
        assignee_name: { type: "string", description: "팀원 이름(예: 함동균, 김세민)" },
      },
      required: ["summary"],
    },
  },
  {
    name: "assign_issue",
    description: "이슈 담당자 변경.",
    input_schema: {
      type: "object",
      properties: { key: { type: "string" }, assignee_name: { type: "string" } },
      required: ["key", "assignee_name"],
    },
  },
  {
    name: "transition_issue",
    description: "이슈 상태 전환(예: '진행 중', '완료', '해야 할 일').",
    input_schema: {
      type: "object",
      properties: { key: { type: "string" }, status: { type: "string" } },
      required: ["key", "status"],
    },
  },
];

async function runTool(name, input) {
  if (name === "search_issues") {
    const issues = await searchIssues(input.jql, ["key", "summary", "status", "assignee"], 30);
    return (
      issues
        .map((i) => `${i.key} ${i.fields.summary} (${i.fields.status?.name || "?"}) — ${i.fields.assignee?.displayName || "미배정"}`)
        .join("\n") || "결과 없음"
    );
  }
  if (name === "create_issue") {
    const acc = input.assignee_name ? await accountFor(input.assignee_name) : null;
    const key = await createIssue({
      summary: input.summary,
      description: input.description || `헤르메스 Slack 요청으로 생성 (요청자: ${requester})`,
      labels: ["hermes-slack"],
      assigneeAccountId: acc,
      issueTypes: ["Task", "작업", "Story", "스토리"],
    });
    const assignNote = input.assignee_name ? (acc ? ` / 배정: ${input.assignee_name}` : ` / 배정실패(${input.assignee_name} 계정없음)`) : "";
    return `생성 ${key}: ${JIRA_BASE}/browse/${key}${assignNote}`;
  }
  if (name === "assign_issue") {
    const acc = await accountFor(input.assignee_name);
    if (!acc) return `담당자 '${input.assignee_name}' Jira 계정을 못 찾음`;
    await jira(`/rest/api/3/issue/${input.key}/assignee`, "PUT", { accountId: acc });
    return `${input.key} → ${input.assignee_name} 배정 완료`;
  }
  if (name === "transition_issue") {
    const to = await transitionIssue(input.key, input.status);
    return `${input.key} → ${to}`;
  }
  return `알 수 없는 도구: ${name}`;
}

const SYSTEM = `너는 InSeoul 팀의 PM 에이전트 "헤르메스"다. 사용자의 Slack 요청을 Jira 작업으로 수행한다.
- Jira 프로젝트 키: ${JIRA_PROJECT}. 도구로 이슈 검색/생성/배정/상태전환 가능.
- 팀: ${team.members.map((m) => `${m.name}(${m.areas.join("/")})`).join(", ")}. 영역에 맞게 담당자를 합리적으로 정해라.
- 요청자: ${requester || "(미상)"}. "내/제 작업"은 요청자 기준.
- 삭제 등 파괴적 작업은 하지 않는다. 모호하면 합리적으로 가정하되 결과에 명시.
- 작업 후 한국어로 무엇을 했는지 간결히 보고(이슈 키/링크 포함).`;

async function main() {
  if (!userText) {
    await slackReply("요청 내용이 비어 있어요. 예: `/hermes 로그인 API 작업 만들어서 함동균한테 배정해줘`");
    return;
  }
  if (!LLM_KEY) {
    await slackReply(":warning: GMS_KEY 미설정 — 요청 해석 불가.");
    return;
  }
  if (!JIRA_ENABLED) {
    await slackReply(":warning: Jira 자격증명 미설정 — 티켓 작업 불가.");
    return;
  }

  const messages = [{ role: "user", content: userText }];
  try {
    for (let i = 0; i < 6; i++) {
      const res = await fetch(LLM_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": LLM_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: MODEL, max_tokens: 1024, system: SYSTEM, tools, messages }),
      });
      if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
      const data = await res.json();
      messages.push({ role: "assistant", content: data.content });

      if (data.stop_reason !== "tool_use") {
        const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
        await slackReply(text || "완료했습니다.");
        return;
      }

      const results = [];
      for (const b of data.content) {
        if (b.type !== "tool_use") continue;
        let out;
        try {
          out = await runTool(b.name, b.input);
        } catch (e) {
          out = `오류: ${e.message}`;
        }
        results.push({ type: "tool_result", tool_use_id: b.id, content: out });
      }
      messages.push({ role: "user", content: results });
    }
    await slackReply("처리 단계가 너무 많아 중단했어요. 요청을 더 구체적으로 나눠 주세요.");
  } catch (e) {
    console.error(e);
    await slackReply(`:warning: 처리 실패: ${e.message}`);
  }
}

main();
