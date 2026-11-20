# 똑띠i 15항목 점검 종합 검토 — Phase 3

M1.3.3 `assets/check-templates.js`의 냉동기 15개 점검 기준 제목과 원문을 추출했습니다.

## 할 수 있는 작업
- 샘플 데이터 또는 읽기 전용 `TTOKTTI_READ_INSPECTION_CONTEXT` 반환 JSON을 브라우저에서 불러옵니다.
- CH-01 15개 항목별 점검결과·기존 사유·사진 등록 참조·측정 메모·기존 조치사항과 문서 양식의 점검 기준을 함께 확인합니다.
- 자료가 없으면 보완 필요 항목으로 표시합니다. 설비 측정값표는 별도 비교합니다.
- 원본 사진 data URL이 포함된 `photoSources`가 있으면 미리보기만 합니다. 원본 JSON을 저장하거나 서버로 전송하지 않습니다.

## 아직 지원하지 않는 기능
- 사진 이미지의 내용 판독이나 적합/미흡 자동 확정
- 현장 Supabase 직접 연결, 사용자 인증 기반 데이터 조회, OpenAI API 호출
- 이미지를 실제로 이해한 원인 분석 및 전문 지식 검색
- 본 템플릿의 점검 기준 문구를 승인된 법적 기준으로 확정하는 일

## 업로드
GitHub 저장소 `Inspection/ttoktti-special-ai/`의 내용으로 테스트 폴더 안의 기존 파일만 업데이트하세요. `performance/` 운영 폴더를 바꾸지 마세요. 가능하면 테스트 브랜치에서 확인한 뒤 GitHub Pages 브랜치에 적용하세요.

## 테스트
Node.js 설치 시 `node tests/test-engine.mjs && node tests/test-review15.mjs`
