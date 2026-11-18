# M1.2.9 통합 사용자 관리 — 설치 전 검토 필수

- 기준: M1.2.8. 원본 이미지/점검 엔진 유지.
- 메인화면 로그인, 내 정보(비밀번호 변경, AI 실측 사용량), 관리자 전용 사용자 관리 UI 추가.
- 관리자 계정 발급/권한 변경/임시 비밀번호 재설정은 ttoktti-admin Edge Function 서버에서 검증.
- 통합 인증은 **AI TEST Supabase 프로젝트**를 기준으로 하며, 기존 업무포털 프로젝트의 Auth 계정은 자동 이전되지 않음.
- AI 기능과 동기화가 동일 계정으로 작동하려면 AI TEST 프로젝트에 `TTOKTTI_M129_SETUP.sql` 및 `supabase_test_sync_setup.sql`의 테이블/정책을 **검토 후** 적용해야 함. 기존 운영 프로젝트에는 실행 금지.
- 기존 `pjt_performance_test_docs_v1` 계정별 자료는 자동 이전되지 않음. 테스트 환경 백업 후 수동 이전 필요.
- 최초 관리자는 Auth Dashboard에서 계정을 만든 후 SQL 파일 마지막 주석의 INSERT 문을 실제 이메일로 바꿔 실행.
- `supabase functions deploy ttoktti-admin` 명령으로 관리자 Edge Function 배포. `SUPABASE_SERVICE_ROLE_KEY`는 서버 환경변수로만 사용. 브라우저에 넣지 말 것.
- `supabase/functions/ttoktti-ai/index.ts`의 서버측 권한 검증은 별도 보강 필요. 프런트의 AI 권한은 서버 보안 장치가 아님.
- 점검표 엔진의 작성/출력 권한도 UI 단독 차단만으로 보안이 확보되지 않음. 서버 데이터 RLS와 함께 후속 검증 필수.
- 로그인 후 클라우드에 기존 자료가 있으면 수동 다운로드를 선택하고, 덮어쓰기 전에 JSON 백업할 것.
- AI 사용량은 기존 AI Edge Function `mode:status` 응답값으로만 표시하며 서버 오류 시 조회 불가로 표시.
- 실제 GitHub/Supabase 배포나 운영 DB 변경은 수행하지 않았음.
