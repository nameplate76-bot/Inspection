# 프로젝트 진행현황 휴대폰 웹앱

## 포함 기능
- 휴대폰/PC 반응형 화면
- 프로젝트 전체 조회 및 검색
- 상태별 필터
- 신규 프로젝트 등록
- 기존 프로젝트 수정/삭제
- 진행률, PM, 점검원, 보고서 담당, 날짜, 연락처, 주소, 메모 관리
- Excel/CSV 가져오기
- Excel 내보내기
- 아이폰 홈 화면 추가(PWA)
- 기본: 브라우저 localStorage 저장
- 선택: Supabase 공동 데이터베이스 연결

## GitHub Pages에 올리는 방법
1. GitHub에서 새 저장소(repository)를 만듭니다.
2. 이 폴더의 파일을 모두 저장소 최상위에 업로드합니다.
3. 저장소의 Settings → Pages로 이동합니다.
4. Build and deployment에서 Deploy from a branch를 선택합니다.
5. Branch를 main, 폴더를 /(root)로 선택하고 Save를 누릅니다.
6. 표시되는 https://사용자명.github.io/저장소명/ 주소로 접속합니다.
7. 아이폰 Safari → 공유 → 홈 화면에 추가를 누르면 앱처럼 사용할 수 있습니다.

## 여러 사람이 같이 쓰는 방법
1. Supabase 프로젝트 생성
2. SQL Editor에서 `supabase_setup.sql` 전체 실행
3. Supabase Project Settings/API에서
   - Project URL
   - anon public key
   를 확인
4. 웹앱 → `데이터 연결` → 두 값을 입력 → 저장

주의: `service_role` 키는 절대 웹앱에 입력하지 마세요.

## Excel 가져오기
첫 번째 시트를 읽습니다. 아래 열 이름은 자동 인식합니다.
- 현장명 / 프로젝트명 / PJT명
- 발주처 / 관리주체
- PM / P.M
- 현장점검원 / 점검원
- 보고서 담당 / 보고서작성자 / 작성자
- 계약일
- 점검일 / 점검예정일
- 완료예정일 / 제출예정일
- 진행상태 / 상태
- 진행률
- 연락처
- 주소 / 현장주소
- 특이사항 / 비고 / 메모

그 외 열은 `extra` 데이터로 보존하고 다시 Excel로 내보낼 때 포함합니다.

## 다음 권장 개선
원본 `PJT 진행 현황.xlsx`를 다시 첨부하면 실제 열 이름, 순서, 상태값, 화면 구성까지 1:1로 맞출 수 있습니다.
운영 단계에서는 직원 로그인(Supabase Auth)과 권한별 RLS 정책을 추가하는 것을 권장합니다.
