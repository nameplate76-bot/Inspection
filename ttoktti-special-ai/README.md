# 똑띠i 전문 AI 엔진 — 1단계 독립 프로토타입

**원본:** TtokttiCheck_M1.3.3_Question_List_Back_Full(1).zip

이 패키지는 기존 웹앱 및 Supabase와 연결하지 않는 **읽기 전용 분석 엔진**입니다. 원본 파일, DB, GitHub 설정은 변경하지 않았습니다.

## 분석한 기존 구조
- 웹 AI UI: `assets/ttoktti-help.js` → Supabase `functions/v1/ttoktti-ai`
- 서버: `supabase/functions/ttoktti-ai/index.ts` → OpenAI `POST /v1/responses`, `store:false`, 환경변수 `OPENAI_MODEL` (기본값 `gpt-6-luna`)
- `tt_users`의 `active`, `role`, `permissions.ai`로 서버 권한 검증, JWT 인증
- 서버 AI 요청 횟수: 테스트 요금제 RPC `ttoktti_ai_reserve_v1` / `ttoktti_ai_finish_v1`
- `assets/legacy-checklist-engine.js`의 `TTOKTTI_READ_INSPECTION_CONTEXT(question)`가 `data.equipment[]`, `measurements[]`(`group`,`item`,`design`,`measured`,`unit`,`percent`,`note`), `items[]`의 판정·사유·조치 및 사진 참조를 반환
- 웹에서 사진을 최대 5장으로 축소 후 전송. 서버에서도 최대 5장의 JPEG data URL만 수신
- 동기화: `assets/cloud-sync.js`에서 `pjt_performance_test_docs_v1`, owner별 `demo/current`의 문서 JSONB 조회 및 업로드. 운영 전체 현장 DB와 동일하다고 가정 금지
- 과거 데이터의 별도 IndexedDB/계정별 데이터베이스 복구 이슈는 `README_M132_RECOVERY.md` 참조

## 신규 파일
- `engine/normalize.mjs`: 읽기 전용 문서에서 설비 식별, 숫자 검증
- `engine/compare.mjs`: 설계값 및 측정값 차이 계산
- `engine/judge.mjs`: **검증·승인된** 기준에 대해서만 범위 판정. 없으면 보류
- `engine/knowledge.mjs`: 테스트용 문서 검색 인터페이스(실제 RAG 인덱스 아님)
- `engine/recommend.mjs`: 근거 표시 및 조치 검토 초안
- `engine/index.mjs`: 모듈 결합
- `tests/test-engine.mjs`: 가상자료 자동 검증
- `docs/PLAN.md`: 단계별 개발 및 안전 배포 계획

## 시험 방법
Node.js 20+ 환경에서 `node tests/test-engine.mjs` 실행. 별도 npm 설치 및 API 키 불필요.

## 현재 제공하지 않는 기능
- OpenAI 실시간 호출 / RAG 벡터 검색 서버 / 실제 사진 시각 분석
- 사용자 계정 및 Supabase 연동 / 클라우드 연결
- 실제 냉동기 법적 판정 / 점검표 자동 반영
- 웹 UI 변경 / 실제 브라우저 로그인 E2E / 운영 데이터 검증

## 보안
프로토타입에서 외부 API 호출·DB 쓰기·파일 쓰기는 하지 않습니다. 후속 백엔드 단계에서 JWT·RLS·tenant/owner 확인을 반드시 서버에서 수행해야 합니다.
