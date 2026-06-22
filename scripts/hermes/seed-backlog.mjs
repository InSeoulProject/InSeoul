// 헤르메스 백로그 시딩 (L1) — 가이드 Epic/Task를 Jira에 생성 + 영역별 자동 배정.
// 자율성 C: 기본 dry-run(제안만). SEED_APPLY=true 일 때만 실제 생성.
// 중복 방지: label `seed` + summary 매칭으로 이미 있으면 건너뜀.
//
// 환경변수: JIRA_BASE_URL/USER_EMAIL/API_TOKEN (필수), JIRA_PROJECT_KEY(기본 NSLPRJCT),
//           SLACK_WEBHOOK_URL(선택), SEED_APPLY=true(적용)

import backlog from "./backlog.json" with { type: "json" };
import team from "./team.json" with { type: "json" };
import {
  JIRA_ENABLED,
  JIRA_PROJECT,
  searchIssueKey,
  createIssue,
  resolveAccountId,
} from "./jira.mjs";

const APPLY = process.env.SEED_APPLY === "true";
const SLACK_URL = process.env.SLACK_WEBHOOK_URL;
const SEED_LABEL = "seed";

function memberByArea(area) {
  const name = team.areaToMember[area];
  return team.members.find((m) => m.name === name) || null;
}

function jqlText(s) {
  return s.replace(/["\\]/g, " ").trim();
}

async function postSlack(text) {
  if (!SLACK_URL) {
    console.log(text);
    return;
  }
  await fetch(SLACK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

async function main() {
  if (!JIRA_ENABLED) {
    console.error("Jira 자격증명 없음 — JIRA_BASE_URL/JIRA_USER_EMAIL/JIRA_API_TOKEN 필요");
    process.exit(1);
  }

  // 담당자 accountId 조회 (이메일 있는 멤버만)
  const accByName = {};
  for (const m of team.members) {
    if (!m.jiraEmail) continue;
    try {
      accByName[m.name] = await resolveAccountId(m.jiraEmail);
    } catch (e) {
      console.error(`accountId 조회 실패(${m.name}):`, e.message);
    }
  }

  const lines = [];
  let createdCount = 0;

  for (const epic of backlog.epics) {
    const epicSummary = `[${epic.key}] ${epic.summary}`;
    let epicKey = await searchIssueKey(
      `project = ${JIRA_PROJECT} AND labels = ${SEED_LABEL} AND summary ~ "${jqlText(epicSummary)}"`,
    ).catch(() => null);

    if (epicKey) {
      lines.push(`= Epic 존재: ${epicSummary} (${epicKey})`);
    } else if (APPLY) {
      epicKey = await createIssue({
        summary: epicSummary,
        description: `가이드 ${epic.key} — ${epic.summary}`,
        labels: [SEED_LABEL, "epic"],
        issueTypes: ["Epic", "에픽"],
      });
      createdCount++;
      lines.push(`+ Epic 생성: ${epicSummary} (${epicKey})`);
    } else {
      lines.push(`+ Epic 생성예정: ${epicSummary}`);
    }

    for (const rawT of epic.tasks) {
      const t = typeof rawT === "string" ? { summary: rawT } : rawT;
      const area = t.area || epic.area;
      const member = memberByArea(area);
      const acc = member ? accByName[member.name] : null;
      const who = member ? `${member.name}${acc ? "" : " (미배정: 이메일 없음)"}` : "(미배정)";

      const exists = await searchIssueKey(
        `project = ${JIRA_PROJECT} AND labels = ${SEED_LABEL} AND summary ~ "${jqlText(t.summary)}"`,
      ).catch(() => null);
      if (exists) {
        lines.push(`  = Task 존재: ${t.summary} (${exists})`);
        continue;
      }
      if (APPLY) {
        const key = await createIssue({
          summary: t.summary,
          description: `${epic.summary} 관련 작업 (${epic.key})`,
          labels: [SEED_LABEL, area],
          assigneeAccountId: acc,
          parentKey: epicKey || undefined,
          issueTypes: ["Task", "작업", "Story", "스토리"],
        });
        createdCount++;
        lines.push(`  + Task 생성: ${t.summary} (${key}) → ${who}`);
      } else {
        lines.push(`  + Task 생성예정: ${t.summary} → ${who}`);
      }
    }
  }

  const head = APPLY
    ? `:white_check_mark: *헤르메스 백로그 시딩 적용* — ${createdCount}개 생성`
    : `:memo: *헤르메스 백로그 시딩 제안 (dry-run)*\n승인하려면 SEED_APPLY=true 로 재실행 (Actions: apply 체크)`;
  const msg = `${head}\n\`\`\`\n${lines.join("\n")}\n\`\`\``;
  await postSlack(msg);
  console.log(APPLY ? `적용 완료: ${createdCount}개` : "dry-run 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
