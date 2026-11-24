/* M1.3.20 local-only original photo recovery vault.
   Inspection deletions archive their original images rather than silently erasing backups.
   Gallery export needs the user's action: iOS cannot silently write into Photos. */
(()=>{'use strict';
 const DB='ttoktti-original-photo-vault-v1', STORE='originals';
 const root=document.getElementById('ttPhotoVault');
 const list=document.getElementById('ttPhotoVaultList');
 const info=document.getElementById('ttPhotoVaultStatus');
 const controls=document.getElementById('ttPhotoVaultControls');
 const toggle=root?.querySelector('[data-photo-vault-refresh]');
 let showArchived=false, openPanel=false, entries=[], selected=new Set(),urls=[];
 const say=t=>{if(info)info.textContent=t};
 function owner(){return window.TTOKTTI_ACCOUNT?.getUser?.()?.id||window.TTOKTTI_ACCOUNT?.getProfile?.()?.id||'local'}
 function authorized(mode='check_view'){return !!window.TTOKTTI_ACCOUNT?.has(mode)}
 function open(){return new Promise((resolve,reject)=>{if(!('indexedDB'in window))return reject(Error('IndexedDB를 사용할 수 없습니다.'));const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||Error('사진 보관함 열기 실패'));r.onblocked=()=>reject(Error('다른 탭에서 저장공간을 사용 중입니다.'))})}
 async function tx(mode,handler){const db=await open();try{return await new Promise((resolve,reject)=>{const t=db.transaction(STORE,mode);let result,settled=false;const fail=e=>{if(!settled){settled=true;reject(e)}};try{handler(t.objectStore(STORE),value=>{result=value},fail)}catch(e){fail(e)}t.oncomplete=()=>{if(!settled){settled=true;resolve(result)}};t.onerror=()=>fail(t.error);t.onabort=()=>fail(t.error)})}finally{db.close()}}
 async function records(){return tx('readonly',(s,set,fail)=>{const r=s.getAll();r.onsuccess=()=>set(r.result||[]);r.onerror=()=>fail(r.error)})}
 async function get(id){return tx('readonly',(s,set,fail)=>{const r=s.get(id);r.onsuccess=()=>set(r.result);r.onerror=()=>fail(r.error)})}
 function compatible(record,meta){return record.account===owner() && record.equipment===String(meta.equipment||'') && (meta.equipmentUid&&record.equipmentUid?record.equipmentUid===String(meta.equipmentUid):true) && (record.slotKey===String(meta.slotKey||'')||(record.slot===String(meta.slot||'')&&meta.slot))}
 async function saveOriginal(file,meta={}){
  if(!authorized('check_edit'))throw Error('점검표 작성 권한이 없습니다.');
  if(!file||!file.size)throw Error('빈 사진 파일');
  const older=(await records()).filter(x=>!x.archived&&compatible(x,meta));
  // Never remove a previously captured original. When replacing a slot, move it to the recovery archive.
  for(const x of older){x.archived=true;x.archiveReason='교체됨';await tx('readwrite',(s,set,fail)=>{const r=s.put(x);r.onsuccess=()=>set();r.onerror=()=>fail(r.error)})}
  const id=crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2);
  const name=file.name||`현장사진_${new Date().toISOString().replace(/[:.]/g,'-')}.jpg`;
  const row={id,blob:file,name,type:file.type||'image/jpeg',size:file.size,equipment:String(meta.equipment||''),equipmentUid:String(meta.equipmentUid||''),slot:String(meta.slot||''),slotKey:String(meta.slotKey||''),account:owner(),createdAt:Date.now(),archived:false};
  await tx('readwrite',(s,set,fail)=>{const r=s.put(row);r.onsuccess=()=>set(id);r.onerror=()=>fail(r.error)});
  say('사진 원본을 이 기기에 보관했습니다. 클라우드 업로드 완료 여부는 점검표에서 별도로 확인하세요.');
  if(openPanel)void refresh();return id;
 }
 async function markDetached(meta={}){
  if(!authorized('check_edit'))return;
  const matching=(await records()).filter(r=>!r.archived&&compatible(r,meta));
  for(const row of matching){row.archived=true;row.archiveReason='점검표에서 삭제됨';await tx('readwrite',(s,set,fail)=>{const r=s.put(row);r.onsuccess=()=>set();r.onerror=()=>fail(r.error)})}
  if(openPanel)void refresh();
 }
 function asFile(entry){return new File([entry.blob],entry.name||'현장사진.jpg',{type:entry.type||'image/jpeg',lastModified:entry.createdAt||Date.now()})}
 function safe(s){return String(s||'사진').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').slice(0,80)}
 function filename(e){const dt=new Date(e.createdAt).toISOString().replace(/[:.]/g,'-');const ext=(e.name.match(/\.[a-z\d]+$/i)||['.jpg'])[0];return `${safe(e.equipment||'설비미지정')}_${dt}_${e.id.slice(0,8)}${ext}`}
 function saveBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
 async function exportEntries(items){
  if(!items.length){say('사진을 먼저 선택해 주세요.');return}
  try{
   // Share multiple images in a single native sheet on supported iOS / Android versions.
   // Limit file counts to avoid crashing the iOS share sheet with hundreds of large photos.
   if(items.length<=10&&navigator.share&&navigator.canShare){const files=items.map(e=>new File([e.blob],filename(e),{type:e.type||'image/jpeg'}));if(navigator.canShare({files})){try{await navigator.share({files,title:`똑띠체크 현장사진 ${files.length}장`});say(`${files.length}장 공유 메뉴를 열었습니다. 사진 앱 저장 여부를 확인해 주세요.`);return}catch(err){if(err?.name==='AbortError')return}}}
   if(!window.JSZip)throw Error('일괄 내보내기에 필요한 ZIP 모듈을 불러오지 못했습니다. 온라인에서 페이지를 한 번 열고 다시 시도하세요.');
   say(`${items.length}장의 사진을 ZIP으로 묶는 중…`);
   const zip=new window.JSZip();for(const e of items)zip.file(filename(e),e.blob);
   const blob=await zip.generateAsync({type:'blob',compression:'STORE'});
   const name=`ttoktti_photos_${new Date().toISOString().slice(0,10)}_${items.length}.zip`;
   // ZIP goes to Files/Downloads, not Photos. Prefer native sheet when supported.
   const file=new File([blob],name,{type:'application/zip'});
   if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'똑띠체크 사진 ZIP 백업'});say('ZIP 공유 메뉴를 열었습니다. iPhone의 파일 앱에 저장할 수 있습니다.');return}catch(err){if(err?.name==='AbortError')return}}
   saveBlob(blob,name);say(`${items.length}장의 사진을 ZIP 파일로 내보냈습니다. iPhone의 파일 앱/다운로드를 확인하세요.`)
  }catch(err){say('일괄 내보내기 실패: '+String(err.message||err))}
 }
 async function purgeArchived(items){if(!authorized('check_edit'))return say('삭제 권한이 없습니다.');const archived=items.filter(x=>x.archived);if(!archived.length)return;
  if(!confirm(`복구 보관함의 사진 ${archived.length}장을 이 기기에서 영구 삭제할까요? 복구할 수 없습니다.\n※ 점검표에 현재 첨부된 사진과 서버 사진은 삭제하지 않습니다.`))return;
  for(const x of archived)await tx('readwrite',(s,set,fail)=>{const r=s.delete(x.id);r.onsuccess=()=>set();r.onerror=()=>fail(r.error)});
  selected.clear();say('선택한 과거 사진을 이 기기의 복구 보관함에서 삭제했습니다.');await refresh();
 }
 function el(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x}
 function closeUrls(){urls.forEach(u=>URL.revokeObjectURL(u));urls=[]}
 function render(){if(!list||!controls)return;closeUrls();list.replaceChildren();controls.replaceChildren();if(!openPanel)return;
  const active=entries.filter(x=>!x.archived),archive=entries.filter(x=>!!x.archived),display=showArchived?archive:active;
  const toolbar=el('div','tt-photo-vault-toolbar');
  const heading=el('strong','',showArchived?`과거·삭제된 사진 ${archive.length}장`:`현재 첨부한 원본 ${active.length}장`);
  const sw=el('button','tt-photo-vault-secondary',showArchived?'현재 첨부 사진 보기':`삭제·교체된 사진 보기 (${archive.length})`);
  sw.type='button';sw.onclick=()=>{showArchived=!showArchived;selected.clear();render()};toolbar.append(heading,sw);controls.append(toolbar);
  if(!display.length){list.append(el('p','',showArchived?'복구 보관함에 지난 사진이 없습니다.':'현재 첨부한 사진 원본이 없습니다. 사진을 촬영하거나 기존 사진을 선택해 주세요.'));return}
  const actions=el('div','tt-photo-vault-toolbar');
  const all=el('label','tt-photo-vault-selectall');const check=document.createElement('input');check.type='checkbox';check.checked=display.every(x=>selected.has(x.id));check.onchange=()=>{display.forEach(e=>check.checked?selected.add(e.id):selected.delete(e.id));render()};all.append(check,document.createTextNode(' 모두 선택'));actions.append(all);
  const exportButton=el('button','',`선택 사진 한 번에 내보내기 (${display.filter(x=>selected.has(x.id)).length})`);exportButton.type='button';exportButton.disabled=!display.some(x=>selected.has(x.id));exportButton.onclick=()=>void exportEntries(display.filter(x=>selected.has(x.id)));actions.append(exportButton);
  if(showArchived){const purge=el('button','tt-photo-vault-danger','선택한 과거 사진 영구 삭제');purge.type='button';purge.disabled=!display.some(x=>selected.has(x.id));purge.onclick=()=>void purgeArchived(display.filter(x=>selected.has(x.id)));actions.append(purge)}controls.append(actions);
  for(const p of display){const line=el('div','tt-photo-vault-item');const cb=document.createElement('input');cb.type='checkbox';cb.checked=selected.has(p.id);cb.setAttribute('aria-label',`${p.equipment} ${p.name} 선택`);cb.onchange=()=>{if(cb.checked)selected.add(p.id);else selected.delete(p.id);render()};
   const thumb=el('img','tt-photo-vault-thumb');const url=URL.createObjectURL(p.blob);urls.push(url);thumb.src=url;thumb.alt='사진 미리보기';thumb.loading='lazy';
   const label=el('div','tt-photo-vault-meta');label.append(el('strong','',`${p.equipment||'설비 미지정'} · ${p.slot||'현장사진'}`),el('small','',`${new Date(p.createdAt).toLocaleString('ko-KR')} · ${Math.round(p.size/1024)}KB${p.archived?' · '+(p.archiveReason||'이전 사진'):''}`));
   line.append(cb,thumb,label);list.append(line)
  }
 }
 async function refresh(){if(!list)return;try{if(!authorized()){say('점검표 조회 권한을 확인한 뒤 사진 보관함을 이용할 수 있습니다.');return}entries=(await records()).filter(r=>r.account===owner()).sort((a,b)=>b.createdAt-a.createdAt);selected=new Set([...selected].filter(id=>entries.some(r=>r.id===id)));render();say(`현재 첨부 원본 ${entries.filter(x=>!x.archived).length}장 · 과거/삭제된 원본 ${entries.filter(x=>x.archived).length}장. 사진 앱 저장은 iPhone 공유 메뉴에서 선택해야 합니다.`)}catch(err){say('사진 보관함을 읽지 못했습니다: '+String(err.message||err))}}
 if(toggle)toggle.addEventListener('click',()=>{openPanel=!openPanel;toggle.textContent=openPanel?'사진 보관함 닫기':'사진 보관함 열기';toggle.setAttribute('aria-expanded',String(openPanel));if(controls)controls.hidden=!openPanel;if(list)list.hidden=!openPanel;if(openPanel)void refresh();else closeUrls()});
 if(controls)controls.hidden=true;if(list)list.hidden=true;if(toggle){toggle.textContent='사진 보관함 열기';toggle.setAttribute('aria-expanded','false')}
 window.addEventListener('ttoktti-account-change',()=>{selected.clear();if(openPanel)void refresh()});
 window.TTOKTTI_OFFLINE_PHOTOS={saveOriginal,markDetached,refresh,get};
})();
