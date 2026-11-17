/* The 1-second CTA cue affects presentation only; no user or data access. */
(() => { 'use strict'; const cue=document.getElementById('startCue'); if(!cue) return;
 window.setTimeout(()=>cue.classList.add('is-visible'),1000);
})();
