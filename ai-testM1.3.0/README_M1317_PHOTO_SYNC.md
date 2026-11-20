# M1.3.17 사진 동기화 수정 및 V86 비교

## V86과 차이
- V86의 `shared-realtime-v34.js`는 `pjt-report-data/company/current.json` 파일을 Supabase Storage에 저장하고 `pjt_shared_state`로 변경을 알립니다.
- M1.3.16은 사진을 데이터 URL로 포함한 단일 JSONB 문서를 `pjt_performance_test_docs_v1`에 저장하여 저장 제한(24MB) 및 대용량 DB 쓰기 부담이 있습니다.
- M1.3.17은 계정별 기존 시험 점검표 테이블과 권한을 유지하면서 **사진 바이트만 비공개 Storage**에 저장하고 JSONB에는 참조 경로를 기록합니다.
- 사진 원본은 IndexedDB에 유지됩니다. 다른 기기는 참조 경로에서 사진을 다운로드해 기존 Data URL 표시 방식으로 복구합니다.

## 배포 및 서버 준비
1. 기존 M1.3.16 ZIP과 PC/모바일 각각 JSON을 백업합니다. 기존 브라우저 사이트 데이터는 지우지 마세요.
2. Supabase 프로젝트가 똑띠체크 테스트 프로젝트인지 확인합니다. `M1317_TEST_PHOTO_BUCKET_SETUP.sql`을 검토 후 SQL Editor에서 **1회 수동 실행**합니다. 운영 DB에 임의 실행하지 마세요.
3. 프로젝트의 Storage에서 private `ttoktti-test-photos` 버킷을 확인합니다.
4. ZIP의 웹 파일들을 GitHub `Inspection/ai-testM1.3.0/`에 폴더 구조 그대로 업로드합니다. `performance/`가 아닙니다.
5. iPhone과 PC 모두 M1.3.17인지 확인하고 동일한 계정으로 로그인합니다.
6. 모바일에서 사진 1장 추가 후 `클라우드 저장 완료`를 확인합니다. 클라우드 저장 실패면 PC에는 나타나지 않습니다.
7. PC에서 상단 `새로고침` 클릭, 사진 확인. PC에서 수정 후 모바일에서도 확인합니다.

## 주의
- 이 수정본은 **실제 Supabase 연결 시험을 수행하지 못했습니다.** SQL 설정과 실제 브라우저 2대 검증이 필요합니다.
- Supabase Storage 전송 오류 시 기존 모바일 IndexedDB 사진은 유지되고 실패 안내가 나타납니다. 데이터 전체 초기화 금지.
- 새 형식은 이전 버전과 클라우드 사진 참조 방식이 다릅니다. 양쪽 기기를 함께 업데이트하세요.
- 여러 계정 간 현장 공유나 다중 현장 분리는 포함하지 않습니다. 단일 계정 시험 문서 `demo/current`를 유지합니다.
- 네트워크 복구 후 웹앱이 열려 있어야 재전송이 가능합니다.
- 개인별 사진 접근 허용은 Storage의 RLS로 제한하며 `service_role` 키는 클라이언트에 추가하지 않습니다.
- 버킷당 단일 파일 제한은 10MB입니다. 그보다 큰 사진은 업로드 실패를 명확하게 표시합니다.
