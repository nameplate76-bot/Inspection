/* M1.0.3 — Account-scoped test-only Supabase sync. No existing portal table is accessed for writes. */
(()=>{'use strict';
  const TABLE='pjt_performance_test_docs_v1', KEY='demo/current';
  const $=id=>document.getElementById(id);
  const statusText=$('m103CloudStatus'), login=$('m103CloudLogin'), actions=$('m103CloudActions');
  let sb=null, account=null, adapter=null, remoteRevision=0, enabled=false;
  let cloudDirty=false, conflict=false, suppress=false, committing=false, refreshBusy=false;
  let generation=0, debounce=null, poll=null, channel=null, lastLocalHash=null, channelState='대기';
  let syncPausedByTimeout=false;
  let pendingLocal=false;
  const notify=(s)=>{if(statusText)statusText.textContent=s};
  // A persistent acknowledgement is the only evidence that this device's local data was uploaded.
  const ackKey=()=>account?'ttoktti-sync-ack-v137-'+account.id:null;
  const digest=obj=>{const str=JSON.stringify(obj);let h=2166136261;for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);return (h>>>0).toString(16)+':'+str.length};
  function readAck(){try{return JSON.parse(localStorage.getItem(ackKey())||'null')}catch{return null}}
  function writeAck(snapshot,revision){try{localStorage.setItem(ackKey(),JSON.stringify({hash:digest(snapshot),revision:Number(revision)}))}catch(e){console.warn('동기화 확인 정보 저장 실패',e)}}
  function alreadyUploaded(snapshot){return readAck()?.hash===digest(snapshot)}
  const isOffline=()=>!navigator.onLine;
  const localQueueLabel=()=>notify('오프라인 · 이 기기에 저장됨 · 클라우드 업로드 대기 (인터넷 연결 후 자동 전송)');
  const describeError=e=>String(e?.message||e?.error_description||e||'알 수 없는 오류');
  const sizeOf=obj=>{try{return new Blob([JSON.stringify(obj)]).size}catch{return Infinity}};
  function localEmpty(obj){return !Array.isArray(obj?.equipment)||(!obj.equipment.length&&!Object.values(obj.info||{}).some(v=>String(v??'').trim()))}
  function validSnapshot(obj){return !!obj&&obj.version===2&&Array.isArray(obj.equipment)&&obj.info&&typeof obj.info==='object'&&Array.isArray(obj.energy)}
  function showLogin(){login.hidden=true;actions.hidden=true;notify('메인화면에서 로그인하면 PC·모바일 동기화를 연결할 수 있습니다')}
  function showAccount(){login.hidden=true;actions.hidden=false;const canWrite=window.TTOKTTI_ACCOUNT?.has('check_edit');$('m103Upload').hidden=!canWrite;$('m103Account').textContent='로그인 계정: '+String(account?.email||'인증됨')}
  function disengage(){enabled=false;conflict=false;cloudDirty=false;syncPausedByTimeout=false;remoteRevision=0;clearTimeout(debounce);if(channel&&sb){sb.removeChannel(channel);channel=null}if(poll){clearInterval(poll);poll=null}}
  async function getRemote(){
    if(!account||!sb)throw Error('로그인이 필요합니다.');
    const {data,error}=await sb.from(TABLE).select('document,revision,updated_at').eq('owner_id',account.id).eq('doc_key',KEY).maybeSingle();
    if(error)throw error;
    return data;
  }
  async function getRemoteVersion(){
    const {data,error}=await sb.from(TABLE).select('revision,updated_at').eq('owner_id',account.id).eq('doc_key',KEY).maybeSingle();
    if(error)throw error;
    return data;
  }
  async function adoptRemote(row,skipConfirm=false){
    if(!row?.document||!validSnapshot(row.document))throw Error('클라우드 문서가 올바르지 않습니다.');
    if(!skipConfirm&&!localEmpty(adapter.get())&&JSON.stringify(adapter.get())!==JSON.stringify(row.document)){
      if(!confirm('이 기기의 작성 내용을 클라우드 자료로 교체합니다. 먼저 「테스트 JSON 백업」을 저장하는 것을 권장합니다. 계속할까요?'))return false;
    }
    syncPausedByTimeout=false;
    suppress=true;
    try{await adapter.replace(row.document);if(row.document.reasonLibrary){localStorage.setItem('performance_m1_test_reasons_v1',JSON.stringify(row.document.reasonLibrary))}}
    finally{suppress=false}
    remoteRevision=Number(row.revision||0);cloudDirty=false;conflict=false;enabled=true;pendingLocal=false;writeAck(row.document,remoteRevision);await adapter.ackPending?.();
    startListening();notify(`클라우드 최신 자료 불러옴 · 버전 ${remoteRevision}`);
    return true;
  }
  async function connect(){
    if(!adapter||!sb)return;
    if(isOffline()){pendingLocal=!!(await adapter.getPending?.().catch(()=>null));localQueueLabel();return}

    try{
      notify('계정 및 승인 상태 확인 중…');
      const result=await sb.auth.getUser();
      if(result.error||!result.data?.user){account=null;disengage();showLogin();return}
      account=result.data.user;
      const {data:profile,error}=await sb.from('tt_users').select('active,role,permissions').eq('id',account.id).single();
      if(error||!profile?.active||!(profile.role==='admin'||(profile.permissions?.sync===true&&profile.permissions?.check_view===true))){account=null;disengage();showLogin();notify('동기화 권한이 있는 사용자만 공유 가능');return}
      showAccount();
      const pending=await adapter.getPending?.();pendingLocal=!!pending;
      const row=await getRemote();
      if(!row){
        remoteRevision=0;
        if(pendingLocal&&window.TTOKTTI_ACCOUNT?.has('check_edit')){
          enabled=true;conflict=false;cloudDirty=true;generation++;startListening();
          notify('미전송 로컬 자료 발견 · 클라우드 최초 등록 중…');void flush();return;
        }
        enabled=false;notify('클라우드 자료 없음 · 이 기기 자료 클라우드에 올리기를 먼저 실행하세요');return
      }
      remoteRevision=Number(row.revision||0);
      if(!validSnapshot(row.document)){enabled=false;notify('서버 문서 형식 오류 · 백업 후 관리자 확인 필요');return}
      const local=adapter.get();
      if(JSON.stringify(local)===JSON.stringify(row.document)){
        enabled=true;conflict=false;cloudDirty=false;pendingLocal=false;writeAck(row.document,remoteRevision);
        await adapter.ackPending?.();startListening();notify(`PC·모바일 자동 동기화 연결됨 · 버전 ${remoteRevision}`);return;
      }
      if(!pendingLocal&&(localEmpty(local)||alreadyUploaded(local))){
        await adoptRemote(row,true);return;
      }
      // Offline edits can be safely uploaded when the server has not advanced
      // since this device's last acknowledged revision. Never overwrite newer work.
      const ack=readAck();
      if(ack?.revision===remoteRevision&&(pendingLocal||ack?.hash!==digest(local))){
        enabled=true;conflict=false;cloudDirty=true;generation++;
        startListening();notify('오프라인 작성 내용 발견 · 클라우드에 안전하게 전송 중…');
        void flush();return;
      }
      enabled=false;conflict=true;notify('이 기기와 클라우드 자료가 서로 다릅니다. JSON 백업 후 업로드/불러오기를 선택하세요. 자동 덮어쓰지 않습니다.');
    }catch(e){console.error('클라우드 연결 실패',e);enabled=false;notify('클라우드 연결 실패 · 로컬은 안전하게 보관됨: '+describeError(e))}
  }
  function startListening(){
    if(!sb||!account||!enabled)return;
    if(channel){sb.removeChannel(channel);channel=null}
    if(poll)clearInterval(poll);
    channel=sb.channel('performance-m137-'+account.id).on('postgres_changes',{event:'*',schema:'public',table:TABLE,filter:'owner_id=eq.'+account.id},()=>{void checkChanges()}).subscribe(state=>{channelState=state;if(state==='SUBSCRIBED'){void checkChanges()}else if(state==='CHANNEL_ERROR'||state==='TIMED_OUT'){notify('실시간 연결 지연 · 자동 재확인으로 동기화 유지')}});
    // Polling is an intentional fallback: Supabase Realtime publication may not be enabled yet.
    poll=setInterval(()=>{if(!isOffline()&&!document.hidden&&enabled)void checkChanges();if(!isOffline()&&enabled&&cloudDirty&&!committing&&!conflict)void flush()},5000);
  }
  async function checkChanges(){
    if(refreshBusy||!enabled||committing||!account||suppress||isOffline())return;
    refreshBusy=true;
    try{
      const info=await getRemoteVersion();
      if(!info)return;
      const latest=Number(info.revision||0);
      if(latest<=remoteRevision)return;
      if(cloudDirty||conflict){conflict=true;enabled=false;notify('다른 기기에서 변경됨 · 현재 작성 내용 보존 · 변경 선택 필요');return}
      const row=await getRemote();
      if(row&&Number(row.revision)>remoteRevision)await adoptRemote(row,true);
    }catch(e){notify('동기화 확인 지연 · 로컬은 보관됨: '+describeError(e))}
    finally{refreshBusy=false}
  }
  function localSaved(snapshot){
    if(suppress)return;
    generation++;cloudDirty=true;pendingLocal=true;
    if(isOffline()){localQueueLabel();return}
    if(!enabled||!account||syncPausedByTimeout)return;
    notify('이 기기 저장됨 · 다른 기기에 자동 전송 중… (전송 완료 전 앱을 닫지 마세요)');
    clearTimeout(debounce);debounce=setTimeout(()=>void flush(),900);
  }
  async function flush(force=false){
    if(committing||!account||!sb||!adapter||conflict||!enabled||syncPausedByTimeout)return;
    if(isOffline()){localQueueLabel();return}
    if(!cloudDirty&&!force)return; if(!window.TTOKTTI_ACCOUNT?.has('check_edit')){notify('점검표 수정 권한이 없어 업로드할 수 없습니다.');return;}
    committing=true;clearTimeout(debounce);
    const sentGen=generation, snap=adapter.get();
    try{
      const bytes=sizeOf(snap);
      if(bytes>24*1024*1024)throw Error('점검표가 24MB를 초과했습니다. 사진을 줄이거나 JSON 백업 후 분할하세요.');
      notify('클라우드 저장 중…');
      let next;
      if(remoteRevision===0){
        const {data,error}=await sb.from(TABLE).insert({owner_id:account.id,doc_key:KEY,document:snap,revision:1}).select('revision').single();
        if(error){if(error.code==='23505'){conflict=true;enabled=false;notify('클라우드에 먼저 저장된 자료가 있습니다 · 수동으로 확인하세요');return}throw error}
        next=Number(data.revision);
      }else{
        const {data,error}=await sb.from(TABLE).update({document:snap,revision:remoteRevision+1,updated_at:new Date().toISOString()}).eq('owner_id',account.id).eq('doc_key',KEY).eq('revision',remoteRevision).select('revision').maybeSingle();
        if(error)throw error;
        if(!data){conflict=true;enabled=false;notify('다른 기기 변경과 충돌 · 이 기기 자료는 유지됨');return}
        next=Number(data.revision);
      }
      syncPausedByTimeout=false;
      remoteRevision=next;
      writeAck(snap,next);
      cloudDirty=(generation!==sentGen);
      if(!cloudDirty){try{await adapter.ackPending?.();pendingLocal=false}catch(e){console.warn('전송 완료 후 로컬 대기 표시 정리 실패',e)}}
      notify(`클라우드 저장 완료 · PC·모바일 자동 공유 · 버전 ${next}`+(cloudDirty?' · 추가 변경 동기화 대기':''));
      if(!poll)startListening();
    }catch(e){
      console.error('클라우드 업로드 실패',e);
      const detail=describeError(e);
      const timedOut=/statement timeout|canceling statement|57014|query timeout/i.test(detail);
      if(timedOut){
        // A timed-out write may have been canceled by PostgreSQL. Do NOT replay
        // an expensive full-document update indefinitely or mark it as saved.
        syncPausedByTimeout=true;
        clearTimeout(debounce);
        notify('클라우드 저장 시간 초과 · 자동 재시도 중지 · 이 기기 자료를 JSON으로 백업하세요. 사진 포함 데이터 용량 및 Supabase DB 상태 확인 필요');
      }else{
        if(isOffline())localQueueLabel();else notify('클라우드 저장 실패 · 업로드 대기(이 기기 자료 보관): '+detail);
      }
    }
    finally{committing=false;if(enabled&&cloudDirty&&!conflict&&!syncPausedByTimeout){clearTimeout(debounce);debounce=setTimeout(()=>void flush(),4000)}}
  }
  async function manualUpload(){
    if(!window.TTOKTTI_ACCOUNT?.has('check_edit')){notify('수정 권한이 없습니다.');return}
    if(!account){alert('먼저 메인화면에서 로그인하세요.');return}
    if(!adapter)return;
    const snapshot=adapter.get();
    if(!validSnapshot(snapshot)){alert('올릴 점검표 데이터가 올바르지 않습니다.');return}
    try{
      const remote=await getRemote();
      if(remote){
        const msg='기존 클라우드 기록을 지금 이 기기 자료로 덮어씁니다. 다른 기기에서 마지막으로 저장한 데이터가 사라질 수 있습니다. 먼저 JSON 백업을 해 두시겠습니까?';
        if(!confirm(msg))return;
        remoteRevision=Number(remote.revision||0);
      }else if(!confirm('현재 이 기기의 점검표를 클라우드에 첫 등록하고 다른 기기에서도 보이게 하시겠습니까?'))return;
      conflict=false;enabled=true;syncPausedByTimeout=false;cloudDirty=true;generation++;
      await flush(true);
      if(enabled&&!conflict&&!poll)startListening();
    }catch(e){notify('업로드 준비 실패: '+describeError(e))}
  }
  async function manualDownload(){
    if(!account)return;
    try{const row=await getRemote();if(!row){notify('가져올 클라우드 자료가 없습니다');return}await adoptRemote(row,false)}
    catch(e){notify('클라우드 불러오기 실패: '+describeError(e))}
  }
  async function manualRefresh(){
    if(!account)return;
    if(syncPausedByTimeout){notify('저장 시간 초과로 동기화가 일시 정지됨 · 먼저 테스트 JSON 백업 후 Supabase 상태를 확인하세요');return}
    if(!enabled){await connect();return}
    await checkChanges();if(enabled&&!cloudDirty)notify(`클라우드 최신 상태 · 버전 ${remoteRevision}`);
  }
  async function loginSubmit(ev){
    ev.preventDefault();if(!sb)return;
    const email=$('m103Email').value.trim(), password=$('m103Password').value;
    if(!email||!password)return;
    notify('로그인 중…');
    try{const {error}=await sb.auth.signInWithPassword({email,password});$('m103Password').value='';if(error)throw error;await connect()}
    catch(e){notify('로그인 실패: '+describeError(e))}
  }
  function localReady(api){
    adapter=api;
    if(!window.TTOKTTI_ACCOUNT?.getClient()){
      notify('클라우드 설정 또는 라이브러리를 불러오지 못함 · 로컬 저장만 사용');return
    }
    try{
      sb=window.TTOKTTI_ACCOUNT?.getClient();if(!sb)throw Error('통합 인증 연결 실패');
      sb.auth.onAuthStateChange((event,session)=>{
        if(event==='SIGNED_OUT'){account=null;disengage();showLogin()}
        else if(event==='SIGNED_IN'&&session?.user?.id!==account?.id)setTimeout(()=>{void connect()},0);
      });
      void connect();
    }catch(e){notify('클라우드 초기화 오류 · 로컬만 사용: '+describeError(e))}
  }
  login?.addEventListener('submit',loginSubmit);window.addEventListener('ttoktti-account-change',()=>{if(sb)void connect()});
  $('m103Upload')?.addEventListener('click',()=>void manualUpload());
  $('m103Download')?.addEventListener('click',()=>void manualDownload());
  $('m103Refresh')?.addEventListener('click',()=>void manualRefresh());
  window.addEventListener('offline',()=>{localQueueLabel()});
  window.addEventListener('online',()=>{notify('인터넷 연결 복구 · 미전송 자료 확인 중…');setTimeout(()=>void connect(),700)});
  window.addEventListener('focus',()=>{if(enabled)void checkChanges()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&enabled)void checkChanges()});
  window.PERFORMANCE_M1_CLOUD={localReady,localSaved,debug:()=>({pendingLocal,isOffline:isOffline(),authenticated:!!account,enabled,remoteRevision,cloudDirty,conflict,syncPausedByTimeout,channelState,localBytes:adapter?sizeOf(adapter.get()):null})};
})();
