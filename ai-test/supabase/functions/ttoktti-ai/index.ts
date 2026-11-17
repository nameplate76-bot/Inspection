// M1.2.3 isolated AI TEST endpoint. Install AI_TEST_BILLING_SETUP.sql ONLY on TEST project.
// API key, service role key, and CORS origin MUST be configured on server, never in GitHub Pages.
import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const API_MODEL = Deno.env.get('OPENAI_MODEL') || 'gpt-6-luna';
const URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''; // legacy publishable; server-side only
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const ALLOWED_ORIGINS = (Deno.env.get('TTOKTTI_ALLOWED_ORIGINS') ?? '').split(',').map(s => s.trim()).filter(Boolean);
function response(status: number, data: unknown, origin: string | null) {
  const headers = new Headers({ 'content-type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'Vary':'Origin' });
  if(origin && ALLOWED_ORIGINS.includes(origin)) { headers.set('Access-Control-Allow-Origin',origin); headers.set('Access-Control-Allow-Headers','authorization,apikey,content-type'); headers.set('Access-Control-Allow-Methods','POST,OPTIONS'); }
  return new Response(JSON.stringify(data), {status,headers});
}
Deno.serve(async req => {
  const origin = req.headers.get('origin');
  if(!origin || !ALLOWED_ORIGINS.includes(origin)) return response(403,{error:'허용되지 않은 서비스 주소입니다.'},null);
  if(req.method==='OPTIONS') return response(200,{ok:true},origin);
  if(req.method!=='POST') return response(405,{error:'POST만 허용됩니다.'},origin);
  if(!URL || !ANON_KEY || !SERVICE_KEY || !OPENAI_KEY) return response(503,{error:'AI 서버 설정이 완료되지 않았습니다.'},origin);
  const rawLength = Number(req.headers.get('content-length')||0);
  if(rawLength > 4096) return response(413,{error:'요청이 너무 큽니다.'},origin);
  const bearer = req.headers.get('authorization') ?? '';
  const token = bearer.match(/^Bearer\s+([^\s]+)$/i)?.[1];
  if(!token) return response(401,{error:'로그인이 필요합니다.'},origin);
  let body: {question?: unknown, mode?: unknown};
  try { const raw=await req.text(); if(raw.length>4096) return response(413,{error:'요청이 너무 큽니다.'},origin); body = JSON.parse(raw); } catch { return response(400,{error:'질문 형식이 올바르지 않습니다.'},origin); }
  const statusOnly = body.mode === 'status';
  const question = typeof body.question==='string' ? body.question.trim() : '';
  if(!statusOnly && (question.length<2 || question.length>250)) return response(400,{error:'질문은 2~250자로 입력하세요.'},origin);
  const userClient = createClient(URL,ANON_KEY,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:userData,error:userError} = await userClient.auth.getUser(token);
  if(userError || !userData?.user || userData.user.is_anonymous) return response(401,{error:'승인된 계정으로 로그인해 주세요.'},origin);
  const uid=userData.user.id;
  const admin=createClient(URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data: profile,error: profileError}=await admin.from('ttoktti_ai_test_approvals_v1').select('approved').eq('user_id',uid).maybeSingle();
  if(profileError || !profile?.approved) return response(403,{error:'테스트 프로젝트에서 승인된 AI 계정만 이용할 수 있습니다.'},origin);
  if(statusOnly) {
    const now=new Date();
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'}).formatToParts(now);
    const seoul=parts.find(x=>x.type==='year')!.value+'-'+parts.find(x=>x.type==='month')!.value;
    const [{data:g,error:ge},{data:u,error:ue}]=await Promise.all([
      admin.from('ttoktti_ai_monthly_global_v1').select('used_count,monthly_cap').eq('month_key',seoul).maybeSingle(),
      admin.from('ttoktti_ai_monthly_users_v1').select('used_included,used_credits,included_limit,credit_allowance').eq('user_id',uid).eq('month_key',seoul).maybeSingle()
    ]);
    if(ge||ue)return response(503,{error:'사용량을 조회하지 못했습니다.'},origin);
    return response(200,{model:API_MODEL,month:seoul,global_used:g?.used_count??0,global_limit:g?.monthly_cap??1000,included_used:u?.used_included??0,included_limit:u?.included_limit??30,credits_remaining:Math.max(0,(u?.credit_allowance??0)-(u?.used_credits??0)),billing:'test_manual_only'},origin);
  }
  const requestId=crypto.randomUUID();
  const {data:quota,error:quotaError}=await admin.rpc('ttoktti_ai_reserve_v1',{p_user:uid,p_id:requestId});
  if(quotaError) return response(503,{error:'AI 사용량 설정을 확인해 주세요.'},origin);
  if(!quota?.ok) return response(429,{error:quota?.reason==='global_limit'?'테스트 전체 월 1,000건 한도에 도달했습니다.':'이번 달 기본 질문 한도를 사용했습니다. 추가 크레딧이 필요합니다.',reason:quota?.reason,usage:quota},origin);
  let success=false; let inputTokens=0; let outputTokens=0; let answer='';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(),25000);
    let res:Response;
    try {
      res=await fetch('https://api.openai.com/v1/responses',{
        method:'POST',signal:controller.signal,
        headers:{Authorization:`Bearer ${OPENAI_KEY}`,'Content-Type':'application/json'},
        body:JSON.stringify({model:API_MODEL,reasoning:{effort:'none'},store:false,max_output_tokens:450,
          instructions:'당신은 기계설비 성능점검 및 유지관리 플랫폼의 AI 도움말 똑띠i입니다. 한국어로 간결하고 정확하게 설명하세요. 실제 화면의 버튼·기능을 확인할 수 없으므로 없는 버튼이나 완료 상태를 지어내지 마세요. 법적 적합 판정을 확정하지 말고 기준값·단위·설비종류를 요청하세요. 개인정보와 현장 민감정보의 입력을 피하도록 안내하세요.',
          input:question})
      });
    } finally {clearTimeout(timeout);}
    if(!res.ok) { const detail=(await res.text()).slice(0,200); console.error('OpenAI HTTP status',res.status,'detail',detail.replace(/sk-[A-Za-z0-9_-]+/g,'[REDACTED]')); throw Error(`OpenAI API HTTP ${res.status}`); }
    const json=await res.json();
    inputTokens=Number(json.usage?.input_tokens||0);outputTokens=Number(json.usage?.output_tokens||0);
    answer=(json.output||[]).flatMap((o: {content?:Array<{type?:string;text?:string}>}) => o.content||[]).filter((c:{type?:string;text?:string}) => c.type==='output_text').map((c:{text?:string}) => c.text||'').join('\n').trim();
    if(!answer) throw Error('Empty AI output');
    success=true;
    return response(200,{answer,model:API_MODEL,usage:{...quota,input_tokens:inputTokens,output_tokens:outputTokens}},origin);
  } catch(e) {
    console.error('AI request failed',e instanceof Error ? e.message : String(e));
    return response(502,{error:'AI 연결에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'},origin);
  } finally {
    const {error:finishError}=await admin.rpc('ttoktti_ai_finish_v1',{p_user:uid,p_id:requestId,p_success:success,p_input:inputTokens,p_output:outputTokens});
    if(finishError) console.error('Quota reconcile error:',finishError.message);
  }
});
