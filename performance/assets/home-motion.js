/* M1.0.8 — 메인 화면 캐릭터 모션 제어. 네트워크/DB/저장소 접근 없음. */
(() => {
  'use strict';
  const button = document.querySelector('.motion-toggle');
  if (!button) return;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const apply = (enabled) => {
    document.documentElement.classList.toggle('motion-off', !enabled);
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? '캐릭터 움직임 끄기' : '캐릭터 움직임 켜기');
    button.innerHTML = enabled ? '<span aria-hidden="true">Ⅱ</span> 움직임 끄기' : '<span aria-hidden="true">▶</span> 움직임 켜기';
  };
  apply(!reduced);
  button.addEventListener('click', () => {
    apply(document.documentElement.classList.contains('motion-off'));
  });
})();
