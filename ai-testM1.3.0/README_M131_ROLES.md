# 똑띠체크 M1.3.1 — 사용자 구분 및 관리자 전체권한

## 변경 사항
- 신규 사용자 등록 폼에 **관리자 / 일반 사용자** 라디오 버튼 추가. 기본값 일반 사용자.
- 관리자 선택 시 여섯 권한 전체 자동 허용. 기존 등록 사용자도 사용자 구분과 권한을 저장할 수 있음.
- `ttoktti-admin` Edge Function에서 역할 검증 및 관리자 전체 권한 강제 설정. 일반 사용자 API 요청은 기존 관리자 검증에 따라 차단.
- 본인 관리자 강등/중지 차단, 마지막 활성 관리자 강등/중지 차단(동시 요청 경쟁은 운영용 DB 트랜잭션으로 추가 강화 필요).
- 기존 로그인/데이터/이미지 원본은 유지. SQL 스키마 변경 불필요.

## 적용 절차
1. 기존 M1.3.0 GitHub 및 Supabase Edge Function 코드를 백업합니다.
2. 별도 테스트 경로의 **index.html, checklist.html, assets/account.js, assets/account.css, assets/permission-gate.js** 를 포함한 웹 정적 파일을 업데이트합니다. ZIP에는 모든 기존 파일을 포함합니다.
3. Supabase Dashboard > Edge Functions > ttoktti-admin > Code에서 제공된 `supabase/functions/ttoktti-admin/index.ts` 로 교체하고 Deploy updates 클릭. **ttoktti-ai는 수정하지 않습니다.**
4. 브라우저 강력 새로고침 후 기존 관리자 로그인, 일반 사용자 생성, 관리자 계정 생성, 역할 변경을 테스트합니다.

## 주의
- 사용자 관리/AI 서버 권한은 서버에서, 점검표 동기화는 RLS에서 확인해야 합니다. 관리자 `role=admin`을 권한의 근거로 사용합니다.
- 기존 M1.3.0의 완전한 서버 기반 항목별 삭제 통제 및 PC-모바일 동기화는 미완성/미검증입니다. 모든 기능이 실제로 작동하는지 검증하지 않은 채 운영하지 마세요.
- 사용자 구분 저장은 관리자만 수행할 수 있습니다. 기존 관리자 로그인 ID/비밀번호 변경 없음.
