# M1.2.6 AI TEST 로그인 UI 수정

- 기존 `assets/ttoktti-ai-test-config.js`의 AI TEST 프로젝트 URL과 공개용 `sb_publishable_` 키를 **원본 그대로 보존**했습니다.
- Supabase 인증 성공 시 AI 테스트 이메일·비밀번호 입력칸과 로그인 버튼을 숨기며, `AI 로그아웃` 버튼만 표시합니다.
- 로그아웃 후 로그인 화면을 다시 표시합니다. 새로고침 후에도 기존 유효한 세션이 있으면 로그인 폼을 숨깁니다.
- 로그인 폼 CSS의 `display:flex`가 HTML `hidden` 속성을 덮어쓰던 문제를 고쳤습니다.
- 구문 검사 및 ZIP 구성 검사를 수행했습니다. 실제 원격 Supabase 로그인과 GitHub Pages 배포는 이 환경에서 확인하지 못했습니다.
- GitHub `Inspection/ai-test/`에 압축 내용물을 올리십시오. 운영 `performance` 폴더 및 운영 DB는 변경하지 마십시오.
- 실사용 전 로그인 → 로그아웃 → 재로그인 → 새로고침을 확인하십시오.
