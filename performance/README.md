# 성능점검표 독립 모듈 M1.0.4 — PC·모바일 계정별 동기화

**기준:** V86에서 분리한 M1.0.2. 기존 업무포털 파일은 수정하지 않습니다.

## 변경사항

- 로그인한 **동일 Supabase 승인 계정**의 PC/휴대전화가 동일한 성능점검표 시험자료를 조회하고 편집합니다.
- 기존 로컬 IndexedDB(`performance-m1-isolated-test-v1` / `demo/current`)는 유지합니다. 인터넷이 끊겨도 이 기기에 저장합니다.
- 중앙 DB는 **새 테이블 `public.pjt_performance_test_docs_v1`만** 사용합니다. `pjt_records`, `pjt_shared_state`, 기존 업무용 저장소를 쓰지 않습니다.
- 기존 업무포털 `supabase-config.js`의 공개 연결정보 및 `pjt_profiles` 승인 계정을 재사용합니다. 별도 계정 생성은 필요 없습니다.
- 로컬 작성 자료와 중앙 자료가 서로 다르면 **무단 덮어쓰기 없이** 업로드/불러오기 버튼으로 선택합니다.
- 작성할 때 로컬에 먼저 저장하고, 연결된 상태라면 약 1.6초 후 클라우드로 자동 저장합니다. 원격 변경은 Realtime과 12초 재확인으로 반영합니다.
- 동시에 수정해 버전이 충돌하면 서버의 이전 변경을 무단 덮어쓰지 않습니다. 각각의 자료를 JSON으로 백업한 다음 수동으로 선택해야 합니다.
- 사진과 입력된 사유·측정값은 보고서 데이터와 함께 보관합니다. 등록 사유 라이브러리도 보고서 문서에 포함합니다.

## GitHub 업로드

새 ZIP의 폴더 경로를 **그대로** `Inspection/performance/` 아래에 복사합니다. 기존 `Inspection/index.html` 등을 수정할 필요가 없습니다.

수정 파일: `performance/index.html`, `performance/manifest.json`, `performance/README.md`, `performance/assets/legacy-checklist-engine.js`, `performance/assets/module.css`.
신규 파일: `performance/assets/cloud-sync.js`, `performance/supabase_test_sync_setup.sql`, `performance/SYNC_TEST_CHECKLIST.md`.

`performance/vendor/`, `performance/assets/check-templates.js`, `performance/assets/offline-xlsx.js`, `performance/assets/criteria-layout.js` 등 기존 파일은 유지합니다.

## 첫 사용

1. 사용자 승인 계정으로 기존 업무포털 또는 독립 모듈에서 로그인합니다.
2. PC에서 기존에 작성한 시험자료를 먼저 `테스트 JSON 백업` 버튼으로 다운로드합니다.
3. `이 기기 자료 클라우드에 올리기` 버튼을 눌러 최초 1회 공유 등록합니다.
4. 휴대전화에서도 **동일한 계정**으로 로그인합니다. 해당 휴대전화에 로컬 자료가 없으면 클라우드 자료가 자동으로 열립니다. 이미 로컬 자료가 있으면 수동 선택을 요구합니다.
5. PC의 적합 사유나 사진을 수정하면 클라우드로 자동 저장되고, 모바일에서는 열린 화면에서 업데이트를 확인합니다.

> **주의:** 다른 직원 계정끼리의 공동 편집은 M1.0.4 범위가 아닙니다. 현재는 같은 Supabase 계정의 PC와 모바일에서만 공유됩니다. 실 운영의 다중 사용자·현장별 분리는 추가적인 권한 설계가 필요합니다.

## 환경·제한

- GitHub Pages가 현재 저장소의 **`../supabase-config.js`** 를 제공해야 합니다. 회사 포털과 같은 Supabase 프로젝트의 **publishable/anon 키**만 사용합니다. **service_role 비밀키는 절대 웹에 두지 않습니다.**
- 브라우저는 Supabase JavaScript 클라이언트를 CDN에서 로드하므로 동기화에는 인터넷 연결이 필요합니다. 클라이언트를 로드하지 못한 경우 로컬 작성을 계속할 수 있습니다.
- RLS는 `auth.uid()`와 `pjt_profiles.approved=true`를 검증합니다. 로그인하지 않은 사용자에게는 중앙 데이터를 공개하지 않습니다.
- 데이터는 **계정당 시험용 문서 한 건(`demo/current`)**으로 관리됩니다. 27종 모든 설비가 해당 문서 안에 있습니다.
- 사진 데이터까지 JSONB에 저장하는 1단계 공유 구조입니다. 문서가 약 24MB를 넘으면 클라우드 업로드를 제한합니다. 실서비스 전에는 현장별 문서와 사진용 Storage로 개선해야 합니다.
- 이전 운영 보고서 또는 다른 계정에서 생성한 자료는 자동으로 가져오지 않습니다.
- 정식 서비스 전에는 다중계정 권한 및 서버 로그, 사진 용량, 대량 설비 분리, 장기 충돌 해소 기능을 추가 검증해야 합니다.

## SQL 설정

`supabase_test_sync_setup.sql`은 신규 시험용 테이블의 설계 및 RLS·Realtime 구성 파일입니다. 이 테이블이 Supabase 프로젝트에 생성되어 있어야 동기화 기능이 동작합니다. 이미 설치되어 있다면 **중복 실행할 필요가 없습니다.**


## M1.0.4 점검항목 미완료/완료 구분

- 점검항목 이동 메뉴에서 **미완료(판정 `미작성` 또는 공란)는 진한 글씨**로 표시합니다.
- **완료(적합, 미흡, 조치필요, 해당없음, 측정불가)는 회색 글씨**로 표시합니다.
- PC와 iPhone/Android에서 `<option>` 스타일을 무시하는 문제를 피하도록 목록형 선택 UI를 사용합니다.
- 목록과 현재 항목 제목 모두 판정 변경 직후 스타일이 갱신됩니다. 별도의 완료 플래그나 DB 변경은 없습니다.
- 항목을 탭/클릭하면 기존 방식대로 선택 항목으로 이동합니다. 키보드 Enter·Tab으로도 조작 가능하고 Esc로 메뉴를 닫습니다.
- **운영 포털 파일·기존 Supabase·동기화 설정은 변경하지 않습니다.**
