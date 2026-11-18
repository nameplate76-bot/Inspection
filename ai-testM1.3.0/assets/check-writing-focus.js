/*
 * M1.2.2 - 점검항목 작성 화면에서 안내·기본정보 패널을 숨깁니다.
 * 점검표 엔진과 계정/저장 데이터를 변경하지 않습니다.
 */
(() => {
  "use strict";
  const composer = document.getElementById("reportComposerPage");
  if (!composer) return;

  const syncVisibility = () => {
    // "← 기본정보·현장사진" 버튼은 점검항목 작성 화면에만 있습니다.
    const isCheckWriting = !!composer.querySelector("[data-show-info]");
    document.body.classList.toggle("tt-check-writing", isCheckWriting);
  };

  // 엔진은 단계 전환 시 편집기 DOM을 새로 렌더링합니다.
  const observer = new MutationObserver(syncVisibility);
  observer.observe(composer, { childList: true, subtree: true });

  syncVisibility();
})();
