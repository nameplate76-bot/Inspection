/* M1.3.2 permission boundary: the editor is not loaded before authentication. */
(()=>{'use strict';
const account=window.TTOKTTI_ACCOUNT,root=document.getElementById('reportComposerPage');
window.addEventListener('ttoktti-auth-diagnostic',event=>{if(!loaded)message(event.detail?.message||'계정 확인 실패')});
let loaded=false,initialId=null,checking=false;
const banner=document.createElement('section');banner.className='tt-permission-banner';banner.setAttribute('role','status');root.before(banner);
const has=p=>!!account?.has(p)&&(p!=='check_delete'||!!account?.has('check_edit'));
function message(s){
 banner.replaceChildren();const info=document.createElement('span');info.textContent=s;banner.append(info);
 const retry=document.createElement('button');retry.type='button';retry.textContent='↻ 계정 연결 재시도';retry.className='tt-auth-retry';
 retry.onclick=async()=>{retry.disabled=true;info.textContent='계정·권한을 다시 확인 중…';try{await account?.refresh?.(true);await sync()}finally{retry.disabled=false}};
 banner.append(retry);banner.hidden=false;
 const status=document.getElementById('m103CloudStatus');if(status&&(!status.textContent||/확인 중/.test(status.textContent)))status.textContent=s;
}
function permissions(){
 const view=has('check_view'),edit=has('check_edit'),del=has('check_delete'),exp=has('check_export'),sync=has('sync');
 document.getElementById('m103Cloud').hidden=!sync;
 root.hidden=!view;
 if(!view){message('점검표 조회 권한이 없습니다. 관리자에게 권한을 요청하세요.');return}
 banner.hidden=true;
 for(const element of root.querySelectorAll('input,textarea,select')){
  if(element.closest('.reConverterGrid,.reCalcKeys'))continue;
  const selection=element.matches('[data-equipment-select],[data-equipment-select-all]');
  if(!element.matches('[type="file"]'))element.disabled=selection?!del:!edit;
 }
 for(const button of root.querySelectorAll('button')){
  const action=button.dataset.action||'';
  const deleteButton=action==='remove'||action==='reset'||button.matches('[data-photo-remove],[data-equipment-photo-remove],[data-reason-remove],[data-vacuum-reason-remove],[data-measure-remove],[data-dialog-measure-remove],[data-equipment-delete-selected]');
  const exportButton=['preview','excel','backup'].includes(action);
  const editingButton=['add','sample'].includes(action)||button.matches('[data-photo-slot],[data-equipment-photo],[data-measure-add],[data-dialog-measure-add],[data-reason-picker],[data-basic-edit],[data-measure-edit]');
  if(deleteButton)button.disabled=!del;
  else if(exportButton)button.disabled=!exp;
  else if(editingButton)button.disabled=!edit;
 }
 const restore=document.getElementById('reRestore');if(restore)restore.disabled=!edit;
}
function required(target){
 const element=target.closest('button,input,textarea,select,label');if(!element)return null;
 const action=element.dataset.action||element.closest('[data-action]')?.dataset.action||'';
 if(['preview','excel','backup'].includes(action))return 'check_export';
 if(action==='remove'||action==='reset'||element.closest('[data-equipment-delete-selected],[data-photo-remove],[data-equipment-photo-remove],[data-reason-remove],[data-vacuum-reason-remove],[data-measure-remove],[data-dialog-measure-remove]'))return 'check_delete';
 if(element.matches('[data-equipment-select],[data-equipment-select-all]'))return 'check_delete';
 if(element.matches('input,textarea,select')&&!element.closest('.reConverterGrid,.reCalcDisplay'))return 'check_edit';
 if(['add','sample'].includes(action)||element.closest('[data-photo-slot],[data-equipment-photo],[data-reason-picker],[data-measure-add],[data-dialog-measure-add],[data-basic-edit],[data-measure-edit]'))return 'check_edit';
 return null;
}
function deny(event){
 if(!root.contains(event.target)&&!event.target.closest?.('.reToolDialog,.rePhotoDialog,.reReasonDialog'))return;
 const needed=required(event.target);if(!needed||has(needed))return;
 event.preventDefault();event.stopImmediatePropagation();
 if(event.type==='click')message('이 작업에 필요한 '+({check_delete:'삭제',check_export:'출력',check_edit:'입력·수정'}[needed]||needed)+' 권한이 없습니다.');
}
for(const type of ['click','input','change','keydown','submit'])document.addEventListener(type,deny,true);
const observer=new MutationObserver(()=>{if(loaded)permissions()});observer.observe(root,{childList:true,subtree:true});
async function sync(){
 if(checking)return;checking=true;
 try{
  await account?.refresh?.();const user=account?.getUser?.(),profile=account?.getProfile?.();
  if(!user||!profile?.active){root.hidden=true;document.getElementById('m103Cloud').hidden=false;message(!user?'로그인 정보가 확인되지 않았습니다. 로그인 후 다시 시도하세요.':'계정은 확인되었으나 사용 권한 조회에 실패했거나 승인되지 않았습니다. 연결 재시도를 누르세요.');return}
  if(initialId&&initialId!==user.id){location.reload();return}initialId=user.id;
  if(!has('check_view')){permissions();return}
  if(!loaded){loaded=true;const script=document.createElement('script');script.src='./assets/legacy-checklist-engine.js?v='+encodeURIComponent(window.TTOKTTI_APP_VERSION||'M1.3.15');script.onerror=()=>{loaded=false;message('점검표 파일 로딩 실패 · 인터넷이나 배포 경로를 확인하고 재시도하세요.');};document.body.appendChild(script)}
  permissions();
 }catch(e){root.hidden=true;message('권한 확인 오류: '+String(e?.message||e)+' · 연결 재시도를 눌러주세요.')}finally{checking=false}
}
window.addEventListener('ttoktti-account-change',()=>{if(!checking)void sync()});
// Revalidate roles for sessions that remain open. DB RLS is the ultimate enforcement.
setInterval(()=>{if(!document.hidden)void sync()},30000);
void sync();
})();
