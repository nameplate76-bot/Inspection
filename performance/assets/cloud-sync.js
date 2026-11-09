/* M1.0.3 — Account-scoped test-only Supabase sync. No existing portal table is accessed for writes. */
(()=>{'use strict';
  const TABLE='pjt_performance_test_docs_v1', KEY='demo/current';
  const $=id=>document.getElementById(id);
  const statusText=$('m103CloudStatus'), login=$('m103CloudLogin'), actions=$('m103CloudActions');
  let sb=null, account=null, adapter=null, remoteRevision=0, enabled=false;
  let cloudDirty=false, conflict=false, suppress=false, committing=false, refreshBusy=false;
  let generation=0, debounce=null, poll=null, channel=null;
  const notify=(s)=>{if(statusText)statusText.textContent=s};
  const describeError=e=>String(e?.message||e?.error_description||e||'알 수 없는 오류');
  const sizeOf=obj=>{try{return new Blob([JSON.stringify(obj)]).size}catch{return Infinity}};
  function localEmpty(obj){return !Array.isArray(obj?.equipment)||(!obj.equipment.length&&!Object.values(obj.info||{}).some(v=>String(v??'').trim()))}
  function validSnapshot(obj){return !!obj&&obj.version===2&&Array.isArray(obj.equipment)&&obj.info&&typeof obj.info==='object'&&Array.isArray(obj.energy)}
  function showLogin(){login.hidden=false;actions.hidden=true;notify('이 기기에만 저장 · 공유하려면 로그인하세요')}
  function showAccount(){login.hidden=true;actions.hidden=false;$('m103Account').textContent='로그인 계정: '+String(account?.email||'인증됨')}
  function disengage(){enabled=false;conflict=false;cloudDirty=false;remoteRevision=0;clearTimeout(debounce);if(channel&&sb){sb.removeChannel(channel);channel=null}if(poll){clearInterval(poll);poll=null}}
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
    suppress=true;
    try{await adapter.replace(row.document);if(row.document.reasonLibrary){localStorage.setItem('performance_m1_test_reasons_v1',JSON.stringify(row.document.reasonLibrary))}}
    finally{suppress=false}
    remoteRevision=Number(row.revision||0);cloudDirty=false;conflict=false;enabled=true;
    startListening();notify(`클라우드 최신 자료 불러옴 · 버전 ${remoteRevision}`);
    return true;
  }
  async function connect(){
    if(!adapter||!sb)return;
    try{
      notify('계정 및 승인 상태 확인 중…');
      const result=await sb.auth.getUser();
      if(result.error||!result.data?.user){account=null;disengage();showLogin();return}
      account=result.data.user;
      const {data:profile,error}=await sb.from('pjt_profiles').select('approved').eq('id',account.id).single();
      if(error||!profile?.approved){account=null;disengage();showLogin();notify('업무포털에서 승인된 사용자만 클라우드 공유 가능');return}
      showAccount();
      const row=await getRemote();
      if(!row){enabled=false;remoteRevision=0;notify('클라우드 자료 없음 · 이 기기 자료 업로드를 눌러 공유 시작');return}
      remoteRevision=Number(row.revision||0);
      if(!validSnapshot(row.document)){enabled=false;notify('서버 문서 형식 오류 · 백업 후 관리자 확인 필요');return}
      const local=adapter.get();
      if(JSON.stringify(local)===JSON.stringify(row.document)){
        enabled=true;conflict=false;cloudDirty=false;startListening();notify(`PC·모바일 동기화 연결됨 · 버전 ${remoteRevision}`);return;
      }
      if(localEmpty(local)){
        await adoptRemote(row,true);return;
      }
      enabled=false;conflict=true;notify('이 기기와 클라우드 자료가 다릅니다 · 업로드 또는 불러오기 선택');
    }catch(e){console.error('클라우드 연결 실패',e);enabled=false;notify('클라우드 연결 실패 · 로컬은 안전하게 보관됨: '+describeError(e))}
  }
  function startListening(){
    if(!sb||!account||!enabled)return;
    if(channel){sb.removeChannel(channel);channel=null}
    if(poll)clearInterval(poll);
    channel=sb.channel('performance-m103-'+account.id).on('postgres_changes',{event:'*',schema:'public',table:TABLE,filter:'owner_id=eq.'+account.id},()=>{void checkChanges()}).subscribe();
    poll=setInterval(()=>{if(!document.hidden)void checkChanges();if(enabled&&cloudDirty&&!committing&&!conflict)void flush()},12000);
  }
  async function checkChanges(){
    if(refreshBusy||!enabled||committing||!account)return;
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
    generation++;cloudDirty=true;
    if(!enabled||!account)return;
    notify('이 기기 저장 완료 · 클라우드 동기화 대기');
    clearTimeout(debounce);debounce=setTimeout(()=>void flush(),1600);
  }
  async function flush(force=false){
    if(committing||!account||!sb||!adapter||conflict||!enabled)return;
    if(!cloudDirty&&!force)return;
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
      remoteRevision=next;
      cloudDirty=(generation!==sentGen);
      notify(`PC·모바일 공유 저장 완료 · 버전 ${next}`+(cloudDirty?' · 추가 변경 동기화 대기':''));
      if(!poll)startListening();
    }catch(e){console.error('클라우드 업로드 실패',e);notify('클라우드 저장 실패 · 로컬 보관됨: '+describeError(e))}
    finally{committing=false;if(enabled&&cloudDirty&&!conflict){clearTimeout(debounce);debounce=setTimeout(()=>void flush(),2600)}}
  }
  async function manualUpload(){
    if(!account){alert('먼저 업무포털 계정으로 로그인하세요.');return}
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
      conflict=false;enabled=true;cloudDirty=true;generation++;
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
    if(!window.supabase||!window.PJT_SUPABASE_URL||!window.PJT_SUPABASE_ANON_KEY){
      notify('클라우드 설정 또는 라이브러리를 불러오지 못함 · 로컬 저장만 사용');return
    }
    try{
      sb=window.supabase.createClient(window.PJT_SUPABASE_URL,window.PJT_SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      sb.auth.onAuthStateChange((event,session)=>{
        if(event==='SIGNED_OUT'){account=null;disengage();showLogin()}
        else if(event==='SIGNED_IN'&&session?.user?.id!==account?.id)setTimeout(()=>{void connect()},0);
      });
      void connect();
    }catch(e){notify('클라우드 초기화 오류 · 로컬만 사용: '+describeError(e))}
  }
  login?.addEventListener('submit',loginSubmit);
  $('m103Upload')?.addEventListener('click',()=>void manualUpload());
  $('m103Download')?.addEventListener('click',()=>void manualDownload());
  $('m103Refresh')?.addEventListener('click',()=>void manualRefresh());
  window.addEventListener('online',()=>{if(enabled&&cloudDirty)void flush();else if(enabled)void checkChanges()});
  window.addEventListener('focus',()=>{if(enabled)void checkChanges()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&enabled)void checkChanges()});
  window.PERFORMANCE_M1_CLOUD={localReady,localSaved,debug:()=>({authenticated:!!account,enabled,remoteRevision,cloudDirty,conflict})};
})();
