# 똑띠i Phase 2: GitHub Pages 브라우저 분석 시제품

- `index.html`과 `app.mjs`가 새로 추가되었습니다. `engine/`은 기존 1단계의 분석 엔진입니다.
- **운영 경로에 덮어쓰지 마세요.** 이 ZIP 안의 `ttoktti-special-ai/` 폴더 내용만 기존 `Inspection/ttoktti-special-ai/` 경로에 추가/교체합니다.
- `https://nameplate76-bot.github.io/Inspection/ttoktti-special-ai/` 에서 화면을 확인합니다. 배포 설정에 따라 반영 시차가 있습니다.
- 권장: `feature/ttoktti-special-ai-phase2` 테스트 브랜치를 생성한 뒤 파일을 업로드하세요. GitHub Pages가 main 브랜치만 배포하도록 설정되어 있으면 새 브랜치는 실제 URL에 보이지 않습니다. 테스트 후 승인 시 main에 반영하세요.
- 브라우저에서 가상 샘플 불러오기 → 분석 실행 → 기준 체크 → 다시 분석 → 결과 비교.
- 추가로 점검문서 `data.equipment` 형태의 **JSON 파일을 사용자가 직접 선택**할 수 있습니다. 실무 개인정보가 들어간 파일을 공개 저장소에 올리지 마세요.
- 연결되지 않은 기능: Supabase 로그인/데이터 로딩, OpenAI API, 실제 사진 영상분석, 전문 문서 검색 서버, 실제 기계설비 법적 적합 판정.
- 서버 측 키나 운영 데이터는 포함하지 않습니다. 각종 임계값은 실제 승인된 근거가 입력된 경우에만 판정합니다.
- Node.js 18+에서 `node --test tests/test-engine.mjs` 또는 `node tests/test-engine.mjs` 를 실행하면 엔진 단위 테스트를 확인할 수 있습니다.
