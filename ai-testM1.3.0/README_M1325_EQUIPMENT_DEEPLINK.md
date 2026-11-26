# M1.3.25 설비 목록 점검표 직접 이동

- 메인 등록 설비 / 작성 중 / 작성 완료 카드에서 조회한 각 설비의 점검표 열기는 해당 설비의 `uid`, `type`, `number`를 URL 쿼리로 전달합니다.
- 점검표는 로그인 및 권한 확인 후 로컬 IndexedDB 자료가 준비되면 고유 UID로 설비를 찾아 곧바로 점검항목 화면(`check`)을 표시합니다.
- 동기화로 UID가 교체된 경우 설비 종류+번호 조합으로 재탐색합니다. 클라우드 자료가 늦게 도착해도 요청 대상을 보류하다가 탐색합니다.
- 설비가 발견되면 주소 파라미터를 제거하고 선택을 로컬 UI 상태로 유지하여 동기화 중 초기화되지 않게 합니다.
- 시험용 demo/current 및 동일 계정 기준으로 작동합니다. 다른 계정/현장 목록을 직접 조회하는 기능은 아닙니다.
- Supabase DB, RLS, 운영 데이터, 권한 및 공식 브랜드 이미지 파일 변경 없음.

## 배포
GitHub `Inspection/ai-testM1.3.0`에 `assets/dashboard-detail.js`, `assets/legacy-checklist-engine.js`, `assets/app-version.js`, `assets/permission-gate.js`, `index.html`, `checklist.html`, `dashboard-detail.html`, `sw.js`, `manifest.json` 교체.

## 검증
등록 설비에서 냉동기 CH-1, 작성 중 CH-2, 완료 설비 각각 점검표 열기를 눌러 직접 선택 확인. 동기화 후 선택 유지 확인.
