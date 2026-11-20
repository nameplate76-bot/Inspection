# M1.3.4 메인 화면 버전 표시 보정

- `index.html`: 메인 상단 「독립 점검 모듈」의 고정 표시 M1.3.3을 M1.3.4로 수정.
- 메인 하단 버전과 문서 제목을 M1.3.4로 수정.
- `assets/app-version.js`의 `window.TTOKTTI_APP_VERSION` 값을 메인 화면 버전 표시에도 동적으로 연동. 점검표 페이지와 공통 버전 정보 사용.
- 이 패치는 새 기능 버전이 아닌 **M1.3.4의 메인 화면 표시 누락 보정**입니다.
- 이번 수정 파일은 `index.html` 하나만 교체해도 적용됩니다. 전체 ZIP은 이전 M1.3.4 주소 검색 수정도 포함합니다.
- 새 릴리스에는 `assets/app-version.js`의 값을 변경하고, 브라우저 캐시 방지를 위해 HTML 안의 `?v=` 값도 변경하거나 강력 새로고침이 필요합니다. 단순히 JS 값을 변경한다고 자동 배포되거나 버전 번호가 자동 증가하지는 않습니다.
- 서버 DB, 운영 데이터, 계정 권한 변경 없음.
- 적용 후 `https://nameplate76-bot.github.io/Inspection/performance/`를 Ctrl+Shift+R로 새로고침하세요.
