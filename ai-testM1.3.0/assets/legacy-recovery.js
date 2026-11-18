/* M1.3.2: opt-in, non-destructive recovery of M1.2.8 IndexedDB snapshots.
   Never deletes legacy data, never uploads automatically. */
(()=>{'use strict';
 const LEGACY='performance-m1-isolated-test-v1', KEY='demo/current';
 const $=id=>document.getElementById(id);
 let legacy=null, backedUp=false;
 const status=msg=>{if($('m132RecoveryStatus'))$('m132RecoveryStatus').textContent=msg};
 const counts=s=>({equipment:s.equipment.length,photos:s.equipment.reduce((n,e)=>n+(e.sitePhoto?1:0)+(e.items||[]).reduce((k,i)=>k+(Array.isArray(i.photos)?i.photos.filter(Boolean).length:0),0),0), bytes:new Blob([JSON.stringify(s)]).size});
 const valid=s=>s&&s.version===2&&s.info&&typeof s.info==='object'&&Array.isArray(s.equipment)&&Array.isArray(s.energy);
 async function readLegacy(){
  if(!window.indexedDB)throw Error('이 브라우저에서 IndexedDB를 사용할 수 없습니다.');
  if(typeof indexedDB.databases==='function'){
   const entries=await indexedDB.databases();
   if(!entries.some(d=>d.name===LEGACY))return null;
  }
  return await new Promise((resolve,reject)=>{
   const req=indexedDB.open(LEGACY);
   req.onupgradeneeded=()=>{req.transaction.abort();}; // Missing DB must not be created.
   req.onerror=()=>{
     if(req.error?.name==='AbortError')resolve(null);
     else reject(req.error||Error('이전 저장공간 접근 실패'));
   };
   req.onsuccess=()=>{
    const db=req.result;
    if(!db.objectStoreNames.contains('reports')){db.close();resolve(null);return}
    const tx=db.transaction('reports','readonly');const row=tx.objectStore('reports').get(KEY);
    row.onsuccess=()=>{db.close();resolve(row.result||null)};
    row.onerror=()=>{db.close();reject(row.error||Error('이전 자료 읽기 실패'))};
   };
   req.onblocked=()=>reject(Error('기존 버전 창을 닫고 다시 시도하세요.'));
  });
 }
 function download(snapshot){
  const blob=new Blob([JSON.stringify(snapshot)],{type:'application/json'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='TtokttiCheck_M128_Legacy_Backup_'+new Date().toISOString().slice(0,10)+'.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 $('m132Scan')?.addEventListener('click',async()=>{
  legacy=null;backedUp=false;$('m132Backup').disabled=true;$('m132Restore').disabled=true;
  status('이 브라우저의 M1.2.8 이전 저장공간을 조회하고 있습니다…');
  try{
   const s=await readLegacy();
   if(!valid(s)){
     status('이 브라우저에 복구 가능한 이전 버전 문서가 없습니다. 예전에 작성했던 PC/휴대폰의 같은 브라우저에서 열거나, 그 기기의 JSON 백업 파일을 사용하세요.');return;
   }
   const c=counts(s);if(!c.equipment&&!Object.values(s.info).some(x=>String(x??'').trim())){status('이전 저장공간은 있지만 내용이 비어 있습니다.');return}
   legacy=s;const mb=(c.bytes/1048576).toFixed(2);
   status(`이전 자료 발견: 설비 ${c.equipment}대, 사진 ${c.photos}장, JSON ${mb}MB. 측정값·사유도 동일 문서에 포함됩니다.\n먼저 「이전 자료 JSON 백업」을 누르세요. 백업 전에 현재 계정으로 복구하지 않습니다.`);
   $('m132Backup').disabled=false;
  }catch(e){status('이전 자료 검색 실패: '+(e?.message||e))}
 });
 $('m132Backup')?.addEventListener('click',()=>{
  if(!legacy)return;
  try{download(legacy);backedUp=true;$('m132Restore').disabled=false;status('이전 자료 JSON 백업 다운로드를 요청했습니다. 브라우저 다운로드 폴더에서 파일이 정상 저장되었는지 반드시 확인한 후 복구하세요.')}catch(e){status('백업 실패: '+e.message)}
 });
 $('m132Restore')?.addEventListener('click',async()=>{
  if(!legacy||!backedUp)return status('먼저 이전 자료 JSON 백업을 다운로드하세요.');
  if(!confirm('현재 로그인 계정의 로컬 점검표가 비어 있는 경우에만 이전 데이터를 복사합니다. 클라우드에는 자동 업로드하지 않습니다. JSON 백업 파일이 다운로드되었는지 확인했습니까?'))return;
  $('m132Restore').disabled=true;
  try{
   const current=window.PERFORMANCE_M1_GET_TEST_SNAPSHOT?.();
   if(!current)throw Error('점검표 화면을 먼저 열고 잠시 후 시도하세요.');
   if(current.equipment?.length||Object.values(current.info||{}).some(x=>String(x??'').trim()))throw Error('현재 계정에 자료가 있으므로 덮어쓰기를 차단했습니다. 이전 자료는 JSON 파일로 보존하고 비교해 주세요.');
   await window.PERFORMANCE_M1_RECOVER_LOCAL(legacy);
   const c=counts(legacy);
   status(`로컬 복구 성공: 설비 ${c.equipment}대, 사진 ${c.photos}장. 측정값·사유를 점검표 화면에서 확인하세요. 클라우드에는 아직 업로드되지 않았습니다. 확인 후 필요할 때만 상단 「이 기기 자료 클라우드에 올리기」를 선택하세요.`);
  }catch(e){status('복구 중단 (기존 자료 유지): '+(e?.message||e))}
  finally{$('m132Restore').disabled=false}
 });
})();
