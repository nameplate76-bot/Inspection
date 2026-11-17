/* M1.1.4 똑띠i 도움말 + opt-in server AI. Local FAQ remains available without API setup. */
(() => {
 'use strict';
 const entries = [{"title": "점검표를 새로 만드는 방법", "answer": "설비별 성능점검표 영역에서 설비종류를 선택하고 설비번호를 입력한 다음 ‘점검표 자동 생성’을 누르세요. 쉼표로 여러 설비번호를 입력하면 번호별 점검표가 생성됩니다.", "keywords": ["새로", "생성", "설비번호", "추가", "등록"]}, {"title": "점검항목을 이동하고 판정하는 방법", "answer": "원하는 설비 버튼을 선택한 뒤 점검항목 이동 메뉴에서 항목을 선택하세요. 해당 항목의 ‘판정’에서 적합·미흡·조치필요·해당없음·측정불가 등을 선택할 수 있습니다.", "keywords": ["판정", "항목", "이동", "적합", "미흡", "완료"]}, {"title": "사진을 첨부하거나 교체하는 방법", "answer": "점검항목 안의 ‘현황 사진’, ‘적합 사진’ 또는 ‘미흡사항 사진’ 칸을 누르세요. 기기에서 사진을 선택하거나 지원되는 환경에서 카메라로 촬영할 수 있습니다. 이미 첨부한 사진도 교체할 수 있습니다.", "keywords": ["사진", "카메라", "촬영", "첨부", "교체", "이미지"]}, {"title": "적합·미흡 사유를 작성하는 방법", "answer": "점검항목의 ‘적합 사유’ 또는 ‘미흡사항 사유’를 눌러 등록된 사유를 선택하세요. ‘새로운 사유 직접 입력’으로 추가할 수도 있습니다. 음성 입력은 브라우저가 지원하는 경우에 이용할 수 있습니다.", "keywords": ["사유", "음성", "마이크", "설명", "문장"]}, {"title": "설계값과 측정값을 입력하는 방법", "answer": "설비를 선택한 뒤 ‘설계·측정값 (항목 / 설계값 / 측정값 / 단위)’ 입력란에 자료를 기록하세요. 점검항목별 ‘측정값 / 확인내용’도 별도로 입력할 수 있습니다.", "keywords": ["측정", "설계", "수치", "입력", "값"]}, {"title": "점검표를 PDF로 저장하는 방법", "answer": "상단의 ‘점검표 PDF 미리보기’를 눌러 보고서를 연 뒤 ‘PDF로 저장 / 인쇄’를 선택하세요. 인쇄 대상에서 ‘PDF로 저장’을 선택하고 A4, 배율 100%, 머리글·바닥글 해제를 확인하세요.", "keywords": ["pdf", "인쇄", "출력", "미리보기"]}, {"title": "점검표를 Excel로 내보내는 방법", "answer": "상단의 ‘점검표 Excel 다운로드’를 누르세요. 내려받은 파일은 PC의 Excel 프로그램에서 확인하거나 편집할 수 있습니다.", "keywords": ["excel", "엑셀", "내보내기", "다운로드"]}, {"title": "작성한 점검표를 저장하는 방법", "answer": "입력 내용은 현재 브라우저의 로컬 저장소에 저장됩니다. 중요한 자료는 ‘테스트 JSON 백업’도 함께 다운로드하세요. 계정 연결 상태에 따라 시험용 클라우드 저장을 사용할 수 있습니다.", "keywords": ["저장", "보관", "로컬", "유실"]}, {"title": "PC와 모바일 자료를 공유하는 방법", "answer": "상단 ‘PC · 모바일 점검표 공유’ 영역에서 동일한 승인 계정으로 로그인하세요. 연결 상태를 확인하고 처음에는 ‘이 기기 자료 클라우드에 올리기’ 또는 ‘클라우드 자료 불러오기’를 직접 선택하세요. 서로 다른 기기의 자료가 충돌하면 무단 덮어쓰지 않도록 주의하세요.", "keywords": ["동기화", "공유", "모바일", "휴대폰", "pc", "클라우드", "로그인"]}, {"title": "자료를 백업하고 복원하는 방법", "answer": "상단의 ‘테스트 JSON 백업’으로 파일을 내려받으세요. 복원할 때에는 ‘백업 불러오기’로 보관한 JSON 파일을 선택합니다. 복원 전에는 현재 자료를 별도로 백업하세요.", "keywords": ["백업", "복원", "불러오기", "json"]}, {"title": "현재 화면의 주요 기능", "answer": "이 화면에서는 현장 기본정보 입력, 27종 설비별 점검표 생성, 적합·미흡 판정, 사진과 사유 입력, 설계·측정값 등록, PDF 미리보기 및 Excel 다운로드, 시험용 PC·모바일 동기화를 할 수 있습니다.", "keywords": ["화면", "기능", "도움", "무엇", "사용법"]}, {"title": "입력된 자료를 삭제하는 방법", "answer": "각 설비를 선택해 ‘이 설비 삭제’를 사용할 수 있습니다. ‘테스트 자료 초기화’는 시험자료 전체에 영향을 줄 수 있으므로, 실행 전 ‘테스트 JSON 백업’을 권장합니다.", "keywords": ["삭제", "초기화", "지우기"]}, {"title": "점검값이 적합한지 판단하는 기준", "answer": "설비의 적합·미흡 판정은 해당 항목의 ‘원본 양식의 점검방법·기준’과 실제 측정값, 현장 상태를 함께 확인해야 합니다. 이 도움말은 판정 결과를 자동 확정하지 않으므로 법정 기준과 현장 전문가의 검토를 우선하세요.", "keywords": ["기준", "법령", "자동판정", "적정", "판단", "기준값"]}, {"title": "다른 현장이나 계정과 자료를 구분하는 방법", "answer": "이 독립 모듈은 현재 시험자료 문서(demo/current) 중심이며 계정별 공유를 지원합니다. 여러 현장을 정식 운영하는 용도로 데이터 구조를 분리한 상태는 아니므로 운영자료를 덮어쓰지 않도록 유의하세요.", "keywords": ["현장", "계정", "다중", "구분", "운영"]}];
 const normalize = v => String(v||'').toLocaleLowerCase('ko-KR').replace(/\s+/g,'');
 const el = (tag,cls,txt) => { const x=document.createElement(tag); if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;};
 const host=el('aside','tt-help');host.setAttribute('aria-label','똑띠i 화면 사용 도움말');
 const panel=el('section','tt-help-window');panel.hidden=true;panel.id='tt-help-panel';panel.setAttribute('aria-label','똑띠i 도움말 대화창');
 const header=el('header','tt-help-header');const avatar=el('img');avatar.src='./assets/ttoktti-i-official-locked.png';avatar.alt='똑띠i 원본 캐릭터';
 const headTitle=el('div','tt-help-header-title');headTitle.append(el('b','', '똑띠i'),el('small','', '점검표 화면 사용을 도와드려요'));
 const close=el('button','tt-help-close','×');close.type='button';close.setAttribute('aria-label','도움말 닫기');header.append(avatar,headTitle,close);
 const log=el('div','tt-help-log');log.setAttribute('role','log');log.setAttribute('aria-live','polite');log.setAttribute('aria-relevant','additions');
 const form=el('form','tt-help-form');const input=el('input','tt-help-input');input.type='text';input.placeholder='궁금한 내용을 직접 입력하세요';input.maxLength=250;input.autocomplete='off';input.setAttribute('aria-label','똑띠i에게 질문 입력');const send=el('button','tt-help-send','전송');send.type='submit';form.append(input,send);
 const usage=el('div','tt-help-usage','테스트 기본형 월 0원 · GPT-6 Luna · 전체 월 1,000건 · 개인 월 30건 + 추가 크레딧 · 결제 비활성');
 const note=el('small','tt-help-note','직접 질문은 로그인 후 생성형 AI로 전달됩니다. 연결 전에는 내장 도움말을 제공합니다. 개인정보·현장 민감정보는 입력하지 마세요.');
 panel.append(header,usage,log,form,note);
 const launch=el('button','tt-help-launch');launch.type='button';launch.setAttribute('aria-label','똑띠i 도움말 열기');launch.setAttribute('aria-controls','tt-help-panel');launch.setAttribute('aria-expanded','false');
 const launchImg=el('img');launchImg.src='./assets/ttoktti-i-official-locked.png';launchImg.alt='';launch.append(launchImg);host.append(panel,launch);document.body.append(host);
 const bottom=()=>{log.scrollTop=log.scrollHeight};
 function say(kind,message){const bubble=el('div','tt-help-msg '+kind,message);log.append(bubble);bottom();}
 function suggestions(){const wrap=el('div','tt-help-questions');const featured=[10,0,1,2,3,4,5,6,7,8,9,11];featured.forEach(n=>{const b=el('button','',entries[n].title);b.type='button';b.onclick=()=>ask(entries[n].title,n);wrap.append(b)});log.append(wrap);bottom();}
 function answerFor(query){const q=normalize(query);let best=null,highest=0;
 for(const entry of entries){let score=0;const title=normalize(entry.title);if(q===title)score+=100;if(q.length>=3&&(title.includes(q)||q.includes(title)))score+=24;
 for(const key of entry.keywords){const k=normalize(key);if(k.length>0&&q.includes(k))score+=k.length>=3?8:4;}
 if(score>highest){highest=score;best=entry;}}
 return highest>=4?best:null;}
 function ask(question,forcedIndex){const q=String(question||'').trim().slice(0,250);if(!q)return;
 say('user',q);log.querySelector('.tt-help-questions')?.remove();const chosen=Number.isInteger(forcedIndex)?entries[forcedIndex]:answerFor(q);
 if(chosen){say('bot',chosen.answer);}
 else{say('bot','입력하신 질문에 대해 이 버전의 내장 도움말에서 확인된 답변을 찾지 못했습니다. 점검표 작성, 사진, 사유, PDF, Excel, 저장 또는 동기화처럼 기능명을 포함해 질문해 주세요.\n\n※ 임의로 답변을 만들어 안내하지 않습니다. 실제 생성형 AI 연동은 별도 보안 서버와 검증이 필요합니다.');}
 }
 // M1.1.3: reset the help session when it closes, without changing inspection data.
 // The dialog is entirely in-memory; no report, local storage, or cloud data is touched.
 // Calls go via authenticated Supabase Edge Function. OpenAI keys must never be in client code.
   let busy=false;let sessionVersion=0;
  let aiClient=null;
  const loginWrap=el('div','tt-help-test-login');
  const loginTitle=el('small','', 'AI 테스트 전용 Supabase 계정 (기존 점검표 공유 로그인과 별개)');
  const loginForm=el('form','tt-help-test-auth');
  const aiEmail=el('input','tt-help-test-email');aiEmail.type='email';aiEmail.required=true;aiEmail.placeholder='테스트 계정 이메일';aiEmail.autocomplete='username';
  const aiPassword=el('input','tt-help-test-password');aiPassword.type='password';aiPassword.required=true;aiPassword.placeholder='테스트 계정 비밀번호';aiPassword.autocomplete='current-password';
  const aiLoginBtn=el('button','tt-help-test-submit','AI 테스트 로그인');aiLoginBtn.type='submit';
  const logoutBtn=el('button','tt-help-test-logout','AI 로그아웃');logoutBtn.type='button';logoutBtn.hidden=true;
  const authState=el('small','tt-help-test-state','AI 테스트 서버를 연결하려면 별도 테스트 계정으로 로그인하세요.');
  loginForm.append(aiEmail,aiPassword,aiLoginBtn);loginWrap.append(loginTitle,loginForm,logoutBtn,authState);
  panel.insertBefore(loginWrap,log);
  function getAiClient(){
    if(aiClient)return aiClient;
    const url=window.TTOKTTI_AI_TEST_URL,key=window.TTOKTTI_AI_TEST_PUBLISHABLE_KEY;
    if(!window.supabase||!url||!key||key.startsWith('PASTE_'))return null;
    try{aiClient=window.supabase.createClient(url,key,{auth:{storageKey:'ttoktti-ai-test-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});return aiClient;}
    catch{return null;}
  }
  async function updateAiAuthUI(){
    const sb=getAiClient();if(!sb){authState.textContent='AI 테스트 공개 설정 파일에 Supabase publishable key를 입력해 주세요.';return;}
    const {data:{session}}=await sb.auth.getSession();
    loginForm.hidden=!!session;logoutBtn.hidden=!session;
    authState.textContent=session?'AI 테스트 로그인: '+String(session.user?.email||'인증됨'):'AI 테스트 전용 계정으로 로그인해 주세요.';
  }
  loginForm.addEventListener('submit',async ev=>{ev.preventDefault();
    const sb=getAiClient();if(!sb){await updateAiAuthUI();return;}
    aiLoginBtn.disabled=true;authState.textContent='로그인 확인 중…';
    try{const {error}=await sb.auth.signInWithPassword({email:aiEmail.value.trim(),password:aiPassword.value});aiPassword.value='';
      if(error)throw error;await updateAiAuthUI();void refreshUsage();}
    catch(e){authState.textContent='테스트 계정 로그인 실패: '+String(e?.message||e)}
    finally{aiLoginBtn.disabled=false;}
  });
  logoutBtn.addEventListener('click',async()=>{const sb=getAiClient();if(sb)await sb.auth.signOut();await updateAiAuthUI();});
  async function aiCall(payload){
    const sb=getAiClient();if(!sb)return {error:'AI 테스트 공개 설정(프로젝트 URL 및 publishable key)을 확인해 주세요.'};
    const {data:{session},error:sessionError}=await sb.auth.getSession();
    if(sessionError||!session?.access_token)return {error:'똑띠i 창의 AI 테스트 계정으로 먼저 로그인해 주세요.'};
    const project=String(window.TTOKTTI_AI_TEST_URL).replace(/\/$/,'');
    try{
      const response=await fetch(project+'/functions/v1/ttoktti-ai',{
        method:'POST',headers:{Authorization:'Bearer '+session.access_token,apikey:window.TTOKTTI_AI_TEST_PUBLISHABLE_KEY,'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      const data=await response.json().catch(()=>({}));
      return response.ok ? data : {error:data.error||'AI 연결 설정을 확인해 주세요.',reason:data.reason};
    }catch{return {error:'AI 서버에 연결할 수 없습니다. Edge Function 배포 및 연결을 확인해 주세요.'};}
  }
async function refreshUsage(){
   const r=await aiCall({mode:'status'});
   if(r.error){usage.textContent='테스트 기본형 월 0원 · GPT-6 Luna · 월 1,000건 / 개인 30건 · '+r.error;return;}
   usage.textContent=`테스트 기본형 월 0원 · ${r.model} · 전체 ${r.global_used}/${r.global_limit}건 · 내 기본 ${r.included_used}/${r.included_limit}건 · 추가 크레딧 ${r.credits_remaining}건 · 결제 비활성`;
 }
 async function directQuestion(question){
   const q=String(question||'').trim().slice(0,250);if(!q||busy)return;
   busy=true;const version=sessionVersion;send.disabled=true;input.disabled=true;
   say('user',q);log.querySelector('.tt-help-questions')?.remove();
   const pending=el('div','tt-help-msg bot','똑띠i가 답변을 준비 중입니다…');log.append(pending);bottom();
   const r=await aiCall({question:q});
   pending.remove();
   if(version!==sessionVersion){busy=false;send.disabled=false;input.disabled=false;return;}
   if(r.answer){say('bot',r.answer);}
   else{
     const known=answerFor(q);
     say('bot',(r.error||'AI 설정이 완료되지 않았습니다.')+(known?'\n\n내장 도움말: '+known.answer:'\n\n현재는 생성형 AI 도움을 제공할 수 없습니다. 먼저 서버 설정을 확인해 주세요.'));
   }
   busy=false;send.disabled=false;input.disabled=false;
   if(!panel.hidden){input.focus();void refreshUsage();}
 }
 function resetHelpSession(){
   sessionVersion++;
   log.replaceChildren();
   input.value='';
   log.scrollTop=0;
 }
 function showWelcome(){
   resetHelpSession();
   say('bot','안녕하세요! 저는 똑띠i예요. 이 점검표에서 무엇을 도와드릴까요? 아래 질문을 선택하거나 직접 입력해 주세요.');
   suggestions();
 }
 function setOpen(open){
   panel.hidden=!open;
   launch.setAttribute('aria-expanded',String(open));
   launch.setAttribute('aria-label',open?'똑띠i 도움말 닫기':'똑띠i 도움말 열기');
   if(open){showWelcome();input.focus();void updateAiAuthUI();void refreshUsage();}
   else{resetHelpSession();launch.focus();}
 }
 launch.addEventListener('click',()=>setOpen(panel.hidden));close.addEventListener('click',()=>setOpen(false));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)setOpen(false)});
 form.addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();if(!q||busy)return;input.value='';void directQuestion(q);});
})();
