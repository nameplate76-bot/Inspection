# M1.3.16 모바일 점검표 초기화 지연 진단·복구

- 원본: M1.3.15 전체 소스
- 수정: 승인된 계정의 점검표 엔진 로딩 상태 표시, 기기 IndexedDB 접근/읽기/업그레이드 차단 진단, 15~20초 대기 타임아웃, 수동 다시 열기, 정상 로딩 완료 표시
- 기존 인증·권한 및 데이터베이스 스키마 그대로 유지. 저장 공간 초기화/삭제 없음.
- 배포 위치: Inspection 저장소 / ai-testM1.3.0 폴더 (`performance` 아님).
- JS 파일: assets/permission-gate.js, assets/legacy-checklist-engine.js, assets/app-version.js
- HTML: checklist.html, index.html / 오프라인 캐시: sw.js
- 주의: 로딩 실패 시 새 메시지를 통해 원인을 확인할 수 있으나 실제 iPhone·Supabase 연결 테스트는 필요함.
- Safari에서 이전 버전이 보이면 모든 동일 사이트 탭 닫고 페이지 재실행. 브라우저 사이트 데이터 삭제는 하지 마세요.
