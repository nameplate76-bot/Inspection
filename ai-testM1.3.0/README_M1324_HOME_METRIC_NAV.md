# 똑띠체크 M1.3.24 메인화면 최소 변경

- 기존 M1.3.23에서 사용자가 요청한 세 항목만 수정합니다.
- 모바일 메인 소개 제목 `기계설비 성능점검 전문 웹앱`이 한 줄로 보이도록 CSS를 보완했습니다.
- 소개 배너의 `점검표 작성 시작하기` 버튼을 삭제했습니다. `빠른 업무 시작 > 점검표 작성` 버튼은 그대로 둡니다.
- 등록 설비 / 작성 중 / 작성 완료 / 업로드 대기 카드를 클릭하면 각각 `dashboard-detail.html?view=...`로 이동합니다.
- 상세 페이지는 현재 계정의 기기 내 시험용 `demo/current`를 **읽기 전용**으로 보여줍니다. 업로드 대기는 `sync_outbox`의 해당 문서 대기 여부만 표시하며 개별 사진 업로드 대기 건수와 혼동하지 않도록 표기합니다.
- 상세 목록의 `점검표 열기`는 기존 점검표로 이동합니다. 선택 설비에 대한 별도 딥링크는 기존 엔진이 지원하지 않으므로 임의 추가하지 않았습니다.
- Supabase 운영 DB, 기존 점검표, 사진·동기화 로직, 공식 상표 및 똑띠i 원본 파일은 변경하지 않았습니다.

## GitHub 설치 경로
`Inspection/ai-testM1.3.0/`에 해당 구조대로 업로드합니다. `performance`가 아닙니다.

## 교체/추가 파일
- `index.html` 교체
- `assets/home.css` 교체
- `assets/home-dashboard.js` 교체 (메시지 문구만 변경)
- `dashboard-detail.html` **추가**
- `assets/dashboard-detail.js` **추가**
- `assets/app-version.js`, `assets/permission-gate.js`, `assets/legacy-checklist-engine.js`, `checklist.html`, `sw.js`, `manifest.json`: 버전·캐시 표기만 갱신

## 검수 항목
1. iPhone 모바일 제목이 한 줄인지 확인
2. 히어로 배너의 중복 버튼이 없는지 확인
3. 4개 카드 클릭 시 해당 상세 화면이 열리는지 확인
4. 각 화면의 현황 숫자 및 대상 목록이 메인 카드와 일치하는지 확인
5. 점검표, 사진, 동기화의 정상 작동 확인
