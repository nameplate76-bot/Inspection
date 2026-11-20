# M1.3.15 — 모바일 계정 확인 지연 및 접속 차단 개선

## 배포 위치 (중요)
기존 GitHub `Inspection` 저장소의 `ai-testM1.3.0/` 폴더에 업로드하세요. `performance/`에 업로드하지 마세요. 사이트 경로: https://nameplate76-bot.github.io/Inspection/ai-testM1.3.0/checklist.html

## 수정
- 계정 연결을 확인 중이라는 메시지가 계속 남는 경우 12초 후 안내 문구 표시.
- 계정 인증·권한 확인 실패 시 편집 화면을 해제하지 않고 상세 이유와 `계정 연결 재시도` 버튼 제공.
- TOKEN_REFRESHED/SIGNED_IN 이벤트로 같은 사용자의 서버 권한 조회가 반복되는 문제 완화.
- 점검표 파일을 읽지 못한 경우 `loaded` 상태를 복구하여 다시 시도할 수 있도록 변경.
- 불필요한 `../supabase-config.js` 요청 제거. 시험용 Supabase 공개 설정 `assets/ttoktti-ai-test-config.js`만 사용.
- 보안: 서버 권한 확인 실패 시 점검자료 접근 허용 없음. 기존 IndexedDB, RLS, 사진, 점검 데이터 삭제 없음.
- 기존 Supabase 테이블, SQL, 운영 DB, 권한·사진은 전혀 변경하지 않음.

## 적용 및 점검
1. 기존 M1.3.14 소스·모바일 로컬 점검자료 JSON 백업.
2. ZIP 압축 해제 후 `Inspection/ai-testM1.3.0/` 안의 파일 교체(폴더 자체를 중첩 업로드하지 않음).
3. `https://nameplate76-bot.github.io/Inspection/ai-testM1.3.0/checklist.html` 접속.
4. 로그인 버튼 또는 계정 연결 재시도 클릭. 화면의 상세 메시지 확인.
5. 계정 승인과 check_view 권한이 확인될 때만 점검표가 나타남.
6. 다른 PC와 모바일에서 동일 문서 실시간 동기화 검증.

## 검증 범위
정적 코드 문법·압축 검사는 시행. 실제 모바일 Safari와 사용자 Supabase 원격 프로젝트에서 인증·RLS·Realtime은 확인하지 못함. 외부 서버 문제 발생 시 표시된 진단 메시지로 추가 원인 구분 필요.
