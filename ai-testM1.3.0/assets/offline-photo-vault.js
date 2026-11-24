/* M1.3.19: An independent, local-only recovery vault for original photo files.
   Never uploads, deletes, or modifies inspection documents. */
(()=>{'use strict';
 const DB='ttoktti-original-photo-vault-v1',STORE='originals';
 const root=document.getElementById('ttPhotoVault'),list=document.getElementById('ttPhotoVaultList'),info=document.getElementById('ttPhotoVaultStatus');
 const say=t=>{if(info)info.textContent=t};
 function open(){return new Promise((resolve,reject)=>{if(!('indexedDB'in window))return reject(Error('IndexedDB를 사용할 수 없습니다.'));const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('다른 탭에서 저장공간을 사용 중입니다.'))})}
 async function tx(mode,handler){const db=await open();try{return await new Promise((resolve,reject)=>{const t=db.transaction(STORE,mode);let result,settled=false;const fail=e=>{if(!settled){settled=true;reject(e)}};try{handler(t.objectStore(STORE),value=>{result=value},fail)}catch(e){fail(e)}t.oncomplete=()=>{if(!settled){settled=true;resolve(result)}};t.onerror=()=>fail(t.error);t.onabort=()=>fail(t.error)})}finally{db.close()}}
 async function saveOriginal(file,meta={}){
  if(!window.TTOKTTI_ACCOUNT?.has('check_edit'))throw Error('점검표 작성 권한이 없습니다.');
  if(!file||!file.size)throw Error('빈 사진 파일');
  // Do not read the whole image into memory; IndexedDB stores the File/Blob directly.
  const id=crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2);
  const account=window.TTOKTTI_ACCOUNT?.getUser?.()?.id||window.TTOKTTI_ACCOUNT?.getProfile?.()?.id||'local';
  await tx('readwrite',(store,resolve,reject)=>{const r=store.put({id,blob:file,name:file.name||'현장사진.jpg',type:file.type||'image/jpeg',size:file.size,equipment:String(meta.equipment||''),slot:String(meta.slot||''),account,createdAt:Date.now()});r.onerror=()=>reject(r.error);r.onsuccess=()=>resolve(id)});
  say('원본 사진을 이 기기의 복구 보관함에 저장했습니다. 점검표 클라우드 저장 여부는 별도로 확인하세요.');
  void refresh();return id;
 }
 async function records(){return tx('readonly',(store,resolve,reject)=>{const r=store.getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})}
 async function get(id){return tx('readonly',(store,resolve,reject)=>{const r=store.get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
 async function shareOrDownload(entry){const file=new File([entry.blob],entry.name,{type:entry.type,lastModified:entry.createdAt});
  if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'똑띠체크 현장사진'});say('공유 메뉴에서 “이미지 저장” 또는 “사진에 저장”을 선택할 수 있습니다.');return}catch(e){if(e?.name==='AbortError')return}}
  const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=entry.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  say('사진 파일을 내보냈습니다. iPhone에서는 공유 메뉴의 “이미지 저장”을 사용하세요.');
 }
 async function refresh(){if(!list)return;try{const account=window.TTOKTTI_ACCOUNT;if(!account?.has('check_view')){list.textContent='점검표 권한 확인 후 원본 사진 목록을 볼 수 있습니다.';return}const id=account?.getUser?.()?.id||account?.getProfile?.()?.id||'local';const data=(await records()).filter(r=>r.account===id).sort((a,b)=>b.createdAt-a.createdAt);list.replaceChildren();if(!data.length){list.textContent='이 기기에 별도로 보관된 원본 사진이 없습니다.';return}for(const p of data){const line=document.createElement('div');line.className='tt-photo-vault-item';const label=document.createElement('span');label.textContent=`${p.equipment||'설비번호 미지정'} · ${p.name} · ${new Date(p.createdAt).toLocaleString('ko-KR')}`;const btn=document.createElement('button');btn.type='button';btn.textContent='사진 앱에 저장 / 내보내기';btn.onclick=()=>void shareOrDownload(p);line.append(label,btn);list.appendChild(line)}}catch(e){say('사진 보관함을 읽지 못했습니다: '+e.message)}}
 root?.querySelector('[data-photo-vault-refresh]')?.addEventListener('click',()=>void refresh());
 window.addEventListener('ttoktti-account-change',()=>void refresh());
 window.TTOKTTI_OFFLINE_PHOTOS={saveOriginal,refresh,get};
 if(root)void refresh();
})();
