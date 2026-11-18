# M1.2.5 AI TEST 로그인 오류 진단 및 조치

## 확인된 원인
`assets/ttoktti-ai-test-config.js`의 `TTOKTTI_AI_TEST_PUBLISHABLE_KEY`가 `PASTE_TEST_PROJECT_PUBLISHABLE_KEY_HERE`로 남아 있습니다. 이 상태에서는 로그인 버튼이 실제 인증 요청을 전송할 수 없습니다. 비밀번호 오류로 판단하지 마세요.

## 설정 방법
1. Supabase 대시보드에서 AI TEST 프로젝트(`axlrmgnwhybosblrvpay`)를 선택합니다. 프로젝트가 맞는지 확인하세요.
2. Project Settings → API Keys에서 **publishable key** (`sb_publishable_...`)를 복사합니다. 일부 프로젝트에서는 legacy `anon` 공개키를 사용할 수 있지만, secret/service_role 키는 절대 사용하지 마세요.
3. 이 ZIP의 `assets/ttoktti-ai-test-config.js` 파일에서 `PASTE_TEST_PROJECT_PUBLISHABLE_KEY_HERE` 문자열을 해당 공개키로 바꿉니다. `window.TTOKTTI_AI_TEST_URL`은 같은 프로젝트 URL이어야 합니다.
4. GitHub `Inspection/ai-test/` 안에 압축을 해제한 수정 파일들을 같은 경로에 배포합니다. ZIP 자체를 올리는 것이 아닙니다. 운영용 `/performance/`, 상위 `supabase-config.js` 및 Supabase 데이터베이스는 수정하지 마세요.
5. 캐시를 비운 뒤 페이지를 다시 열고, 별도 AI TEST 프로젝트의 Authentication → Users에 존재하는 이메일/비밀번호로 로그인하세요. 새 프로젝트라면 운영 계정이 자동으로 복사되지 않습니다.
6. 로그인 후 직접 질문이 실패하면 Edge Function `ttoktti-ai`, JWT 설정, 테스트 프로젝트 SQL 및 `OPENAI_API_KEY` 서버 시크릿을 별도로 점검해야 합니다.

## 유의사항
- 이 ZIP에는 사용자의 Supabase 공개키가 들어 있지 않으므로 **설정 없이 즉시 로그인되는 완성본은 아닙니다**. 앱에서는 원인을 분명히 표시하도록 수정했습니다.
- 공개키를 저에게 채팅으로 보낼 필요가 없습니다. 테스트 프로젝트 대시보드에서 직접 적용하세요.
- 브라우저에서 secret/service_role 키를 사용하는 우회 방식은 보안상 금지합니다.
- AI 도우미 로그인과 점검표 PC·모바일 공유 로그인은 서로 다른 설정/인증 흐름입니다.
