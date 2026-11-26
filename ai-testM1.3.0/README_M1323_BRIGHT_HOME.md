# 똑띠체크 M1.3.23 — 메인화면 09+03+10 디자인 적용

## 변경 범위
- 기존 M1.3.22 전체 소스에 **메인화면 디자인만** 적용
- PC: 밝은 화이트/청록 전문가 대시보드, 왼쪽 업무 메뉴, 오프라인 안내, 최근 점검 설비
- 모바일: 상단 브랜드/연결 상태, 2열 통계, 3열 빠른 메뉴, 하단 빠른 탐색
- 똑띠체크 상표 `assets/ttoktti-check-wordmark-locked.png` 와 똑띠i `assets/ttoktti-i-official-locked.png` 원본 파일 무수정
- 통계와 최근 설비는 로그인 계정의 **이 기기 저장된 시험용 demo/current 데이터**를 읽기 전용으로 표시; 없는 경우 임의 수치 생성 안 함
- 네트워크 상태 `navigator.onLine`은 연결 힌트일 뿐 Supabase 업로드 성공 인증이 아님
- 모든 업무 메뉴는 기존 `checklist.html`로 연결; 향후 독립 메뉴가 생기면 연결 대상만 변경

## 변경 파일
- `index.html`: 메인 화면 구조 교체
- `assets/home.css`: PC/모바일 밝은 반응형 스타일
- `assets/home-dashboard.js`: 신규, 읽기 전용 로컬 통계 및 연결 상태 표시
- `assets/app-version.js`, `assets/permission-gate.js`, `assets/legacy-checklist-engine.js`, `checklist.html`: 버전 M1.3.23 정합성
- `sw.js`: 정적 캐시 키 및 새 CSS/JS 파일 등록
- `manifest.json`: 새 배경색, 버전 반영

## 유지 및 안전성
- 기존 계정·권한/점검 데이터/사진 업로드/오프라인 저장/동기화 로직을 변경하지 않음
- Supabase SQL/운영 DB 변경 없음, 공개/비밀키 재생성 없음
- 서비스워커의 캐시 갱신은 정적 파일만 대상
- 메인 화면의 현장 리스트는 진짜 클라우드 전 현장 대시보드가 아닌 로컬 시험 점검표의 설비 목록임

## GitHub 업로드
`Inspection/ai-testM1.3.0/` 경로의 해당 파일을 같은 위치에 교체 또는 추가. 버전 두 기기에서 확인 후 점검표 기능 점검 권장.

## 배포 후 확인
1. PC/모바일 메인화면 밝은 디자인과 반응형 레이아웃
2. 원본 로고·똑띠i 이미지가 기존 파일 그대로인지
3. 로그인·내정보·관리자 기능 및 점검표 바로가기
4. 점검표에서 CH-2 사진, 판정, 로컬 저장, 클라우드 저장 동작
5. 오프라인에선 기기 로컬 자료만 표시되는지

## 검증 한계
JavaScript 구문 및 ZIP 파일 검사는 완료. 라이브 GitHub Pages, 실기기 iPhone 및 Supabase 동기화 회귀 시험은 별도로 필요.
