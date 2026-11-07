#!/usr/bin/env node
// /create 스킬 규칙 중 "정규식으로 결정론적 판정이 되는 것"만 막는다.
// 문맥이 필요한 규칙(B4·D5·B7 등)은 여기 넣지 않는다 — 오탐이 작업을 멈춘다.
// 정본: ../../.cursor/skills/create/SKILL.md  ·  프로젝트 규칙: ../../AGENTS.md

const CHECKS = [
  {
    id: "K1",
    // 공개 접두사 + 비밀스러운 이름. NEXT_PUBLIC_FIREBASE_* 는 K2(공개가 정상)라 제외.
    re: /\b(?:NEXT_PUBLIC_|VITE_)(?!FIREBASE_)[A-Z0-9_]*(?:SECRET|PRIVATE_KEY|SERVICE_ROLE|GEMINI|DATA_GO_KR|ADMIN)[A-Z0-9_]*\b/g,
    msg: "비밀에 NEXT_PUBLIC_/VITE_ 접두사가 붙었습니다. 이 값은 브라우저 번들에 그대로 박힙니다.\n     → 접두사를 떼고 서버 라우트(app/api/*/route.ts)에서 process.env로 읽으세요. (K1·K3)",
  },
  {
    id: "B6",
    // 여는 태그 안에 onClick 이 있는 div/span
    re: /<(?:div|span)\b[^>]*\sonClick[=\s]/g,
    msg: "클릭 핸들러가 div/span에 붙었습니다. 키보드 포커스와 스크린리더에서 눌리지 않습니다.\n     → 누르는 것은 <button>, 이동하는 것은 <a>. (B6)",
  },
];

const TEXT_FILE = /\.(?:tsx?|jsx?|mjs|cjs)$/i;
const ENV_FILE = /(^|[\\/])\.env(\.|$)/i;

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0); // 훅이 작업을 깨지 않게 — 파싱 실패는 통과
  }

  const input = payload?.tool_input ?? {};
  const file = input.file_path ?? "";
  if (!file) process.exit(0);
  if (file.includes("create-rules-check")) process.exit(0);
  if (!TEXT_FILE.test(file) && !ENV_FILE.test(file)) process.exit(0);

  const texts = [
    input.content,
    input.new_string,
    ...(Array.isArray(input.edits) ? input.edits.map((e) => e?.new_string) : []),
  ].filter((t) => typeof t === "string" && t.length > 0);

  if (texts.length === 0) process.exit(0);

  const hits = [];
  for (const { id, re, msg } of CHECKS) {
    for (const text of texts) {
      const found = text.match(re);
      if (found) {
        hits.push(`  [${id}] ${found[0].trim().slice(0, 80)}\n     ${msg}`);
        break;
      }
    }
  }

  if (hits.length === 0) process.exit(0);

  process.stderr.write(
    `create 규칙 위반으로 쓰기를 막았습니다 (${file}):\n\n${hits.join("\n\n")}\n\n` +
      `고친 뒤 다시 시도하세요. 이 판정이 틀렸다면 사용자에게 알리고 진행 여부를 물으세요.\n`
  );
  process.exit(2);
});
