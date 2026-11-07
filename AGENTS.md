<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:create-rules -->

# capsule-me — 작업 규칙

전체 규칙(44개)은 `.cursor/skills/create/SKILL.md`(= `.claude/skills/create/`). 여기엔 **이 프로젝트의 확정 사항**과 **편집 중 어기기 쉬운 것**만 둔다. 규칙 본문을 복사해 오지 않는다 — 어긋난다.

## 확정 사항

- **스택** Next 16.3.1 · React 19.2 · TS · Tailwind v4. v4라 `tailwind.config.js`가 **없다** — 토큰은 `app/globals.css`의 `@theme`.
- **백엔드** 인증·DB·스토리지 전부 Firebase. Blaze 사용 중이므로 Firebase Storage를 쓴다(`SKILL.md` S4의 Supabase 대체안은 이 프로젝트에 해당 없음).
- **스키마** `capsules`: `recipient` `letter` `openDate`(YYYY-MM-DD **문자열**) `photos[{path,url}]` `ownerUid` `createdAt` `weather{}` `aura{}`. 그 외 `stats/public`, `makers/{uid}`.
  **`firestore.rules`가 스키마 정본이다** — 필드를 더하려면 `isValidCapsule`의 `hasOnly`부터 고친다. 안 고치면 쓰기가 거부된다.
- **Storage 경로** `capsules/{ownerUid}/{capsuleId}/...` — rules가 정규식으로 강제한다.
- **env** 공개: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_FIREBASE_*`(웹 config는 공개가 정상). **서버 전용**: `GEMINI_API_KEY`, `DATA_GO_KR_KEY`. 모델은 하드코딩하지 않고 `GEMINI_MODEL`.
- **이미지 호스트** `next.config.ts`의 `remotePatterns`에 3개 등록됨(firebasestorage 2종 + lh3.googleusercontent.com).
- **서버 라우트** `api/weather` · `api/places` · `api/capsule-aura` — 외부 키는 전부 여기서만 읽는다.
- **배포** Vercel. canonical·OG·sitemap의 기준 주소는 `NEXT_PUBLIC_SITE_URL`.

## 편집 중 지킬 것

- 화면 파일은 `page.tsx`. 특수 파일(`layout` `loading` `error` `not-found` `route`) 외에 임의 이름의 라우트 파일을 만들지 않는다.
- `params`는 Promise. `const { id } = await params`.
- 서버 컴포넌트가 기본. **초기 데이터는 서버에서 `await`** — `useEffect`+`fetch`로 첫 데이터를 가져오지 않는다. `'use client'`는 클릭·입력·state가 있는 파일에만.
- **열람 가부 판정은 서버에서.** 잠긴 분기의 응답에 `letter`·`photos`를 넣지 않는다. 가리는 것은 잠금이 아니다.
- 새 이미지 호스트를 쓰면 `remotePatterns`에 먼저 등록한다. 안 하면 배포에서 이미지가 전부 죽는다.
- `GEMINI_API_KEY`·`DATA_GO_KR_KEY`에 `NEXT_PUBLIC_`을 붙이지 않는다.
- `openDate`는 KST 기준인데 **배포 서버는 UTC**다. 날짜 비교는 오프셋을 명시한다.
- 누르는 건 `<button>`, 이동은 `<a>`. 클릭 핸들러 붙은 `div` 금지. 모든 `img`에 `alt`.

## 상태 (2026-08-27)

**고쳐짐**

1. **열람 판정이 서버(규칙)로 내려갔다.** `letter`·`photos`는 이제 `capsules/{id}/sealed/content` 하위문서에 저장되고, `firestore.rules`의 `isUnsealed()`가 열람일 전 읽기를 거부한다. 잠긴 동안 본문은 **브라우저에 도착하지 않는다.** `getCapsule`/`listMyCapsules`가 이 문서를 합치려 시도하고, 거부되면 `letter=""` `photos=[]`로 남는다.
   - `openDate`는 KST 자정 기준이고 `request.time`은 UTC라 규칙에서 9시간을 뺀다.
   - **2026-08-27 이전에 묻힌 캡슐은 본문이 아직 상위 문서에 있다**(레거시 폴백으로 계속 열림). 그것들은 여전히 잠금 전 본문이 브라우저로 간다 — 옮기려면 별도 마이그레이션이 필요하다.
2. **에러·404 경계 추가.** `app/error.tsx`(재시도 버튼), `app/not-found.tsx`. `loading.tsx`는 넣지 않았다 — 현재 페이지들은 실제로 기다리는 구간이 없어 빈 깜빡임만 생긴다.

**남은 사람 작업**

- [ ] `npx firebase deploy --only firestore:rules` — **이걸 하기 전까지는 sealed 하위문서 쓰기가 거부되어 새 캡슐을 묻을 수 없다.** 규칙은 로컬에서 문법 검증을 못 했으니 배포 출력에서 컴파일 통과를 확인할 것.
- [ ] 배포 후 캡슐 하나를 '내일' 열람일로 묻고 → F12 Network에 `letter`가 없는지 확인 → 열람일 지나면 보이는지 확인.

<!-- END:create-rules -->
