/* M1.3.15: A non-destructive, explicit cloud refresh. Never reload the page. */
(()=>{'use strict';
 const button=document.getElementById('ttSyncRefresh');
 const status=document.getElementById('ttNavSyncStatus');
 if(!button)return;
 const say=s=>{if(status)status.textContent=s};
 button.addEventListener('click',async()=>{
   if(button.disabled)return;
   button.disabled=true;button.textContent='↻ 확인 중…';say('최신 점검자료를 확인하고 있습니다.');
   try{
     if(!navigator.onLine){say('오프라인 · 이 기기에 저장된 기록은 유지됩니다.');return}
     const sync=window.PERFORMANCE_M1_CLOUD;
     if(!sync?.refreshNow){say('점검표가 로딩 중입니다. 잠시 후 다시 누르세요.');return}
     const result=await Promise.race([sync.refreshNow(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('서버 응답이 지연되고 있습니다.')),14000))]);
     say(result?.ok?'최신 자료 확인 완료 · '+result.message:(result?.message||'동기화 상태를 확인하세요.'));
   }catch(e){say('새로고침 실패 · 로컬 기록은 유지됩니다. '+(e?.message||String(e)))}
   finally{button.disabled=false;button.textContent='↻ 새로고침';}
 });
})();
