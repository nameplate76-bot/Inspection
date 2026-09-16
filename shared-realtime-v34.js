/* v34: 기기별 localStorage/IndexedDB 업무자료를 Supabase 공통 저장소와 실시간 동기화합니다. */
(()=>{'use strict';
const SCOPE='company',REPORT_KEY='performance-report-v2',COMPOSER_KEY='performance-report-composer-v1',REPORT_BUCKET='pjt-report-data',REPORT_PATH='company/current.json';
const COLLECTION_KEYS=[
 'pjt_sales_contracts_v1',
 'pjt_inspection_teams_v1','pjt_inspection_assignments_v1',
 'pjt_inspection_plans_v1','pjt_inspection_completions_v1',
 'pjt_inspection_equipment_v1','pjt_equipment_inspections_v1',
 'pjt_performance_reason_library_v1'
];
const reportPrefix='mechanical-performance-report-';
let client=null,channel=null,managementChannel=null,startPromise=null,started=false,applyingRemote=false,warned=false,retryTimer=null;
const cache=new Map(),saveTimers=new Map(),saveWaiters=new Map(),refreshTimers=new Map();
const connected=()=>Boolean(window.PJT_SUPABASE_URL&&window.PJT_SUPABASE_ANON_KEY&&window.supabase);
const activeUser=async()=>{const {data}=await client.auth.getSession();return data.session?.user||null};
const transientNetworkError=error=>/load failed|failed to fetch|networkerror|network request failed|timeout|timed out|connection.*lost/i.test(String(error?.message||error));
const retrySync=()=>{if(retryTimer||!navigator.onLine)return;retryTimer=setTimeout(()=>{retryTimer=null;ensureStarted().catch(notifyError)},5000)};
const notifyError=error=>{console.error('업무자료 중앙 동기화 오류',error);if(transientNetworkError(error)){document.documentElement.dataset.sharedSync='retrying';retrySync();return}if(warned)return;warned=true;alert('업무자료의 중앙 서버 연결을 확인하지 못했습니다.\n\n로그인 상태와 중앙 동기화 설정을 확인해 주세요.\n\n'+(error?.message||error));};
const safeJson=raw=>{try{return JSON.parse(raw)}catch{return null}};
const composerSnapshot=()=>{const data={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(reportPrefix))data[key.slice(reportPrefix.length)]=localStorage.getItem(key)}return data};
const applyComposer=data=>{Object.entries(data||{}).forEach(([key,value])=>localStorage.setItem(reportPrefix+key,String(value??'')))};
const localCollection=key=>{const raw=localStorage.getItem(key);return raw===null?null:safeJson(raw)};
const putLocal=(key,data)=>{if(key===COMPOSER_KEY)applyComposer(data);else if(COLLECTION_KEYS.includes(key))localStorage.setItem(key,JSON.stringify(data))};
const refreshLater=key=>{clearTimeout(refreshTimers.get(key));refreshTimers.set(key,setTimeout(()=>{
 try{
  if(key==='pjt_sales_contracts_v1'){window.prepareSalesYears?.();window.renderContractList?.();window.renderSalesDashboard?.()}
  else if(key==='pjt_inspection_teams_v1'){window.renderInspectionTeams?.();window.renderInspectionAssignments?.()}
  else if(key==='pjt_inspection_assignments_v1'){window.renderInspectionAssignments?.();window.renderInspectionPlans?.();window.renderInspectionCompletions?.()}
  else if(key==='pjt_inspection_plans_v1'){window.prepareInspectionWorkYears?.();window.renderInspectionPlans?.();window.renderInspectionDashboard?.()}
  else if(key==='pjt_inspection_completions_v1'){window.prepareInspectionWorkYears?.();window.renderInspectionCompletions?.();window.renderInspectionDashboard?.()}
  else if(key==='pjt_inspection_equipment_v1'){window.renderEquipmentList?.();window.renderItemInspectionList?.(window.inspectionItemMode||'performance')}
  else if(key==='pjt_equipment_inspections_v1')window.renderItemInspectionList?.(window.inspectionItemMode||'performance');
  else if(key==='pjt_performance_reason_library_v1')window.PJT_REASON_LIBRARY_UPDATED?.();
  else if(key===COMPOSER_KEY&&document.getElementById('reportComposerPage')?.classList.contains('active'))window.renderComposer?.();
 }catch(error){console.warn('동기화 화면 갱신 대기',error)}
},120))};
async function writeNow(key,data){
 if(applyingRemote||!connected())return;
 await ensureStarted();const user=await activeUser();if(!user)throw new Error('로그인 정보가 없어 중앙 서버에 저장하지 못했습니다.');
 const row={scope:SCOPE,data_key:key,data,updated_by:user.id,updated_at:new Date().toISOString()};
 const {data:saved,error}=await client.from('pjt_shared_state').upsert(row,{onConflict:'scope,data_key'}).select('data_key,updated_at').single();
 if(error)throw error;cache.set(key,{data,updated_at:saved?.updated_at||row.updated_at});
}
async function uploadReport(snapshot){
 await ensureStarted();const user=await activeUser();if(!user)throw new Error('로그인 정보가 없어 보고서를 중앙 서버에 저장하지 못했습니다.');
 const body=new Blob([JSON.stringify(snapshot)],{type:'application/json'});
 const {error}=await client.storage.from(REPORT_BUCKET).upload(REPORT_PATH,body,{upsert:true,contentType:'application/json',cacheControl:'0'});if(error)throw error;
 const marker={storage_path:REPORT_PATH,bytes:body.size,report_version:snapshot.version||2,saved_at:new Date().toISOString()};await writeNow(REPORT_KEY,marker);return marker;
}
async function downloadReport(marker){
 if(marker?.version===2&&marker.info&&Array.isArray(marker.equipment))return marker;
 const path=marker?.storage_path||REPORT_PATH,{data,error}=await client.storage.from(REPORT_BUCKET).download(path);if(error){if(/not found|404/i.test(String(error.message||error)))return null;throw error}
 const parsed=JSON.parse(await data.text());return parsed?.version===2?parsed:null;
}
function scheduleSave(key,data,delay=550){
 if(applyingRemote)return Promise.resolve();clearTimeout(saveTimers.get(key));
 return new Promise((resolve,reject)=>{const waiters=saveWaiters.get(key)||[];waiters.push({resolve,reject});saveWaiters.set(key,waiters);saveTimers.set(key,setTimeout(async()=>{const queued=saveWaiters.get(key)||[];saveWaiters.delete(key);try{await writeNow(key,data);queued.forEach(x=>x.resolve())}catch(error){queued.forEach(x=>x.reject(error));notifyError(error)}},delay))});
}
async function applyRemote(row,announce=false){
 if(!row?.data_key)return;const known=cache.get(row.data_key);if(known?.updated_at&&row.updated_at&&known.updated_at>=row.updated_at)return;
 cache.set(row.data_key,{data:row.data,updated_at:row.updated_at||''});applyingRemote=true;
 try{
  if(row.data_key===REPORT_KEY){if(window.PJT_REPORT_IS_OPEN?.()){const report=await downloadReport(row.data);if(report)await window.PJT_APPLY_SHARED_REPORT?.(report)}else window.PJT_MARK_SHARED_REPORT_STALE?.()}
  else{putLocal(row.data_key,row.data);refreshLater(row.data_key)}
 }finally{applyingRemote=false}
 if(announce&&typeof window.toast==='function')window.toast('다른 기기에서 변경한 업무자료가 반영되었습니다');
}
async function migrateMissing(remoteKeys){
 const jobs=[];
 for(const key of COLLECTION_KEYS){const value=localCollection(key);if(!remoteKeys.has(key)&&value!==null)jobs.push(()=>writeNow(key,value))}
 const composer=composerSnapshot();if(!remoteKeys.has(COMPOSER_KEY)&&Object.keys(composer).length)jobs.push(()=>writeNow(COMPOSER_KEY,composer));
 for(const job of jobs)await job();
}
async function start(){
 if(started||!connected())return;client=window.PJT_SHARED_SB||window.supabase.createClient(window.PJT_SUPABASE_URL,window.PJT_SUPABASE_ANON_KEY);
 const user=await activeUser();if(!user)return;started=true;
 const {data,error}=await client.from('pjt_shared_state').select('data_key,data,updated_at').eq('scope',SCOPE);if(error)throw error;
 const rows=data||[],keys=new Set(rows.map(row=>row.data_key));for(const row of rows)await applyRemote(row,false);await migrateMissing(keys);
 channel=client.channel('pjt-all-business-live').on('postgres_changes',{event:'*',schema:'public',table:'pjt_shared_state',filter:`scope=eq.${SCOPE}`},payload=>applyRemote(payload.new,true).catch(notifyError)).subscribe((status,error)=>{if(error)console.warn('실시간 동기화 채널 재연결 대기',error)});
 managementChannel=client.channel('pjt-management-live').on('postgres_changes',{event:'*',schema:'public',table:'pjt_management_entries'},()=>{if(document.body.classList.contains('managementMode'))window.openManagementLedger?.()}).subscribe();
 document.documentElement.dataset.sharedSync='connected';
}
function ensureStarted(){if(started)return Promise.resolve();if(!startPromise)startPromise=start().catch(error=>{started=false;startPromise=null;throw error});return startPromise}
function stop(){if(channel&&client)client.removeChannel(channel);if(managementChannel&&client)client.removeChannel(managementChannel);channel=null;managementChannel=null;started=false;startPromise=null;cache.clear();document.documentElement.dataset.sharedSync='disconnected'}

window.PJT_SHARED_REPORT_LOAD=async()=>{await ensureStarted();const marker=cache.get(REPORT_KEY)?.data;return marker?downloadReport(marker):null};
window.PJT_SHARED_REPORT_SAVE=snapshot=>{clearTimeout(saveTimers.get(REPORT_KEY));return new Promise((resolve,reject)=>{const waiters=saveWaiters.get(REPORT_KEY)||[];waiters.push({resolve,reject});saveWaiters.set(REPORT_KEY,waiters);saveTimers.set(REPORT_KEY,setTimeout(async()=>{const queued=saveWaiters.get(REPORT_KEY)||[];saveWaiters.delete(REPORT_KEY);try{await uploadReport(snapshot);queued.forEach(x=>x.resolve())}catch(error){queued.forEach(x=>x.reject(error));notifyError(error)}},1600))})};
window.PJT_SHARED_COLLECTION_SAVE=(key,data)=>COLLECTION_KEYS.includes(key)?scheduleSave(key,data):Promise.reject(new Error('공유할 수 없는 자료 형식입니다.'));

if(typeof window.salesPut==='function'){
 const original=window.salesPut;window.salesPut=salesPut=function(key,rows){original(key,rows);if(key==='pjt_sales_contracts_v1')scheduleSave(key,rows).catch(()=>{})};
}
if(typeof window.inspectionStorePut==='function'){
 const original=window.inspectionStorePut;window.inspectionStorePut=inspectionStorePut=function(key,rows){original(key,rows);if(COLLECTION_KEYS.includes(key))scheduleSave(key,rows).catch(()=>{})};
}
if(typeof window.renderComposer==='function'&&window.composerKey){
 const originalRender=window.renderComposer;window.renderComposer=renderComposer=function(){const result=originalRender();const root=document.getElementById('reportComposerPage');root?.querySelectorAll('[data-compose]').forEach(el=>el.addEventListener('input',()=>scheduleSave(COMPOSER_KEY,composerSnapshot(),700).catch(()=>{})));const note=root?.querySelector('.composerFoot small');if(note)note.textContent='입력 내용은 로그인된 PC와 휴대폰에 자동 저장·공유됩니다.';return result};
}
if(typeof window.composerSave==='function')window.composerSave=composerSave=async function(){document.querySelectorAll('#reportComposerPage [data-compose]').forEach(el=>localStorage.setItem(reportPrefix+el.dataset.compose,el.value));try{await writeNow(COMPOSER_KEY,composerSnapshot());alert('작성 내용을 중앙 서버에 저장했습니다. 다른 PC와 휴대폰에 바로 공유됩니다.')}catch(error){notifyError(error)}};
if(typeof window.composerFillCommon==='function'){const original=window.composerFillCommon;window.composerFillCommon=composerFillCommon=function(){const result=original();scheduleSave(COMPOSER_KEY,composerSnapshot(),50).catch(()=>{});return result}};

document.addEventListener('DOMContentLoaded',()=>{if(!connected())return;client=window.PJT_SHARED_SB||window.supabase.createClient(window.PJT_SUPABASE_URL,window.PJT_SUPABASE_ANON_KEY);client.auth.onAuthStateChange((event,session)=>{if(session)setTimeout(()=>ensureStarted().catch(notifyError),0);else stop()});ensureStarted().catch(error=>{if(!/로그인 정보/.test(String(error?.message||error)))notifyError(error)})});
window.addEventListener('online',()=>{warned=false;if(!started)retrySync()});
})();
