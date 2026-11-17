# M1.2.4 AI TEST 업로드 안내

- 업로드 대상: `Inspection/ai-test/` 폴더 내부
- 이 압축파일은 `performance/` 상위 폴더 없이 `index.html`, `checklist.html`, `assets/`가 루트에 위치합니다.
- GitHub에서 `ai-test` 폴더를 연 뒤 **압축 해제된 내부 파일과 assets 폴더 내용**을 같은 상대 경로로 교체합니다. ZIP 파일만 올리면 배포되지 않습니다.
- GitHub 웹 UI에서 기존 `assets` 디렉터리가 그대로 유지되는지 확인하세요. GitHub 웹 업로드는 폴더를 그대로 드래그하거나 파일별로 업로드할 수 있습니다.
- `/performance/` 폴더는 수정하지 않습니다. 기존 `supabase-config.js`, 인증키, 운영 DB를 변경하지 않습니다. SQL 실행 불필요.
- 브라우저를 새로고침(Ctrl+Shift+R)한 뒤 홈 상단 M1.2.4, 측정값표에서 비율과 열량 자동 계산을 확인합니다.
- 본 패키지는 V86 원본 ZIP과 직접 대조한 것이 아니라 이전 M1.2.4 소스를 기반으로 배포 경로 및 캐시, 버전 표시를 정비한 것입니다. 계산값은 운영 사용 전 검증하세요.
