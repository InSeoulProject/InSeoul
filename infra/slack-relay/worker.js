// Hermes Slack relay (Cloudflare Worker).
// Slack /hermes 슬래시 커맨드를 받아 서명 검증 후 GitHub repository_dispatch 로 릴레이.
// 무거운 처리는 GitHub Actions(scripts/hermes/command.mjs)가 수행하고 Slack response_url로 회신.
//
// 필요한 secret/var (wrangler):
//   secret: SLACK_SIGNING_SECRET, GH_TOKEN (repo dispatch 권한 PAT)
//   var:    GH_REPO (예: InSeoulProject/InSeoul)

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Hermes Slack relay is up.");
    }
    const body = await request.text();
    const ts = request.headers.get("x-slack-request-timestamp") || "";
    const sig = request.headers.get("x-slack-signature") || "";

    // 재전송(replay) 방지: 5분
    if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) {
      return new Response("stale request", { status: 401 });
    }
    if (!(await verifySlack(env.SLACK_SIGNING_SECRET, ts, body, sig))) {
      return new Response("bad signature", { status: 401 });
    }

    const p = new URLSearchParams(body);
    const clientPayload = {
      text: p.get("text") || "",
      user_name: p.get("user_name") || "",
      user_id: p.get("user_id") || "",
      channel_id: p.get("channel_id") || "",
      response_url: p.get("response_url") || "",
    };

    const ghRes = await fetch(`https://api.github.com/repos/${env.GH_REPO}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "hermes-slack-relay",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ event_type: "hermes-command", client_payload: clientPayload }),
    });

    const ack = ghRes.ok
      ? ":hourglass_flowing_sand: 헤르메스가 처리 중입니다..."
      : `:warning: 트리거 실패 (GitHub ${ghRes.status}). 잠시 후 다시 시도해 주세요.`;
    // 슬래시 커맨드 즉시 응답(3초 내). 최종 결과는 Actions가 response_url로 회신.
    return Response.json({ response_type: "ephemeral", text: ack });
  },
};

async function verifySlack(secret, ts, body, sig) {
  if (!secret || !ts || !sig) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`v0:${ts}:${body}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const expected = `v0=${hex}`;
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
