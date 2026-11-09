# 성능점검표 독립 개발 모듈 M1.0.0

**기준:** 기존 업무포털 V86 `Performance_Checklist_PDF_Save_Fix_V86.zip`의 `report-editor.js`, `report-editor.css`, `check-templates.js`.

**목적:** 기존 업무포털 파일은 수정하지 않고 `performance/` 경로에서 성능점검표만 독립 실행. V86에 있는 27종 설비 점검항목, 사진, 사유, 측정값 편집 UI 및 기존 PDF 양식 함수를 재사용합니다.

## 실행

GitHub Pages에 배포된 저장소의 `https://<사용자>.github.io/<저장소>/performance/`로 접속합니다. 로컬에서는 폴더의 상위 디렉터리에서 `python -m http.server 8000` 명령 후 `http://localhost:8000/performance/`에 접속합니다. 파일을 `file://`로 직접 열면 일부 브라우저에서 저장과 사진 기능이 제한될 수 있습니다.

## 테스트 절차

1. 오른쪽 위 버전 `M1.0.0`을 확인합니다.
2. 「예시 냉동기 생성」 또는 27종 목록에서 설비종류와 번호를 입력해 추가합니다.
3. 설비 기본정보, 점검 결과, 사진, 적합·미흡 사유, 조치사항, 설계·측정값을 입력합니다.
4. 새로고침 후 입력값이 유지되는지 확인합니다.
5. 「점검표 PDF 미리보기」를 누르고 새 창에서 「PDF로 저장 / 인쇄」를 사용합니다. 브라우저 팝업을 허용해야 합니다.
6. 「점검표 Excel 다운로드」를 클릭하여 `.xlsx`를 다운로드합니다. 파일에는 **편집 가능한 셀과 사진**이 들어갑니다.
7. 「테스트 JSON 백업」 및 「백업 불러오기」로 이 모듈의 데이터만 내보내고 가져올 수 있습니다.

## 운영 데이터에 영향이 없는 이유

- 원래 포털의 `index.html`, `report-editor.js`, DB 및 SQL 파일은 ZIP에 포함되지 않습니다.
- Supabase 클라이언트, API URL, 인증 토큰 및 `shared-realtime-v34.js`를 로딩하지 않습니다.
- 브라우저 IndexedDB 이름은 **`performance-m1-isolated-test-v1`**, 키는 **`demo/current`**입니다. V86의 `mechanical-report-v2/current`를 읽거나 쓰지 않습니다.
- 사유 라이브러리 localStorage 키도 **`performance_m1_test_reasons_v1`**으로 분리했습니다.
- 기존 서버 동기화 함수 이름을 비활성 이름으로 교체했습니다.
- 외부 네트워크에 의존하는 런타임 자산이 없습니다. Excel 파일은 `vendor/jszip.min.js`를 이용해 로컬에서 생성합니다.

## 한계 및 다음 단계

- **M1은 기존 V86 기능 보존형 첫 분리본입니다.** UI 내부에 V86의 다중 탭 관련 유휴 함수가 아직 남아 있으며, 다음 단계에서 `templates/`, `editor/`, `export/`, `data/`로 실제 코드 분리를 진행해야 합니다.
- PDF는 V86의 HTML 인쇄 기능을 점검표 페이지만 출력하도록 제한한 것입니다. 원본 148페이지 양식과 완전 일치함을 보장하지 않습니다.
- Excel은 독립 모듈용 로컬 OOXML 생성기를 사용합니다. 모든 텍스트/사진/측정값을 편집 가능한 시트로 내보내지만 원본 PDF의 정밀한 셀 병합·인쇄 페이지 완전 일치는 향후 작업입니다.
- 테스트 데이터는 **해당 브라우저/기기에서만** 저장됩니다. 다른 기기와 자동 동기화되지 않습니다. 브라우저 데이터를 삭제하면 테스트 자료가 사라지므로 JSON 백업을 권장합니다.
- 외부 백업(JSON)을 불러오는 기능은 V86 형식 `version:2`를 지원하지만, 운영 데이터는 직접 가져오기 전 별도 백업해야 합니다.
- 대용량 사진이 많으면 브라우저 IndexedDB 저장 용량 제한 및 출력 파일 크기 문제가 있을 수 있습니다.
- 보안상 `performance/`는 시험용 공개 페이지입니다. 실제 고객·현장·개인정보를 입력하지 말고 가상 테스트 데이터로만 사용하세요. GitHub Pages는 기본적으로 URL을 아는 사람이 페이지에 접근할 수 있으며 로그인 제한이 없습니다.

## 파일 배치

```text
Repository/
  index.html                        # 운영본: 변경하지 않음
  ...                               # 운영본: 변경하지 않음
  performance/
    index.html
    README.md
    manifest.json
    assets/
      legacy-checklist-engine.js
      legacy-editor.css
      check-templates.js
      offline-xlsx.js
      module.css
    vendor/
      jszip.min.js
      LICENSE.markdown
```

기준: 성능점검표 소스 V86 / 독립모듈 M1.0.0 (2026-11-09).
