# 똑띠체크 M1.3.18 — 동기화 시 선택 설비 유지

## 현상
CH-2에서 현장사진 촬영/첨부 후 클라우드 데이터가 수신되면 화면이 CH-1로 돌아감.

## 확인된 원인
`assets/legacy-checklist-engine.js`의 클라우드 문서 교체 어댑터(`localReady`의 `replace`)와 `PERFORMANCE_M1_APPLY_LOCAL_REPORT`가 데이터를 적용할 때 무조건 `d.equipment[0].uid`를 선택함. 두 동기화 경로 모두 같은 문제가 있음.

## 수정
- 동기화 적용 직전 `selected`(설비 UID), 설비종류/설비번호, `equipmentViews`의 현재 하위 화면, 스크롤 위치를 임시로 보존.
- 동기화 후 동일 UID가 존재하면 유지. UID가 재발급된 경우 동일 설비종류·설비번호로 복원. 대상 설비가 실제 삭제된 경우에만 첫 설비 선택.
- 현재 설비의 기본정보/점검항목/설계·측정값 화면을 유지하고, 렌더링 후 스크롤 위치 복원.
- IndexedDB 초기 로딩 도중 사용자가 설비를 전환한 경우에도 가능한 범위에서 선택을 유지.
- 동기화 데이터, Supabase 정책, 버킷, 기존 사진과 점검기록 구조는 변경하지 않음.

## 업데이트
GitHub `Inspection/ai-testM1.3.0/`에 `assets/legacy-checklist-engine.js`, `assets/app-version.js`, `assets/permission-gate.js`, `index.html`, `checklist.html`, `sw.js`를 같은 경로로 업로드. 기존 `supabase-config.js` 보존.

## 회귀 확인
1. PC·모바일 모두 M1.3.18. CH-2 기본정보에서 현장사진을 등록하고 서버 저장 완료 확인.
2. PC·모바일 화면 모두 CH-2에 머무는지 확인.
3. CH-2 점검항목 및 설계·측정값 화면에서도 같은 테스트.
4. CH-1의 사진/기록은 변하지 않는지, 반대 기기에서 CH-2 사진이 표시되는지 확인.
5. 오프라인 첨부 후 온라인 복구 시에도 현재 설비가 유지되는지 확인.

## 검증 범위
JavaScript 문법과 파일 구조/ZIP 무결성 검사. 실제 iPhone Safari와 Supabase 양방향 테스트는 배포 후 수행해야 함.
