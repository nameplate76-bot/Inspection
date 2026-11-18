import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const headers={'Access-Control-Allow-Origin':'https://nameplate76-bot.github.io','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json'};
const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return respond({error:'Method not allowed'},405);
 try{
  const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  if(!token)return respond({error:'로그인 필요'},401);
  const publicClient=createClient(url,anon),admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:{user},error:authError}=await publicClient.auth.getUser(token);
  if(authError||!user)return respond({error:'인증 실패'},401);
  const {data:caller,error:profileError}=await admin.from('tt_users').select('role,active').eq('id',user.id).single();
  if(profileError||!caller?.active||caller.role!=='admin')return respond({error:'관리자 권한 없음'},403);
  const b=await req.json(),action=String(b.action||'');
  if(action==='list'){
   const {data,error}=await admin.from('tt_users').select('id,email,role,active,permissions').order('created_at',{ascending:false});
   if(error)throw error;return respond({users:data});
  }
  if(action==='create'){
   const email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');
   const role=b.role==='admin'?'admin':b.role==='user'||b.role==null?'user':null;
   if(!role)return respond({error:'잘못된 사용자 구분'},400);
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<8)return respond({error:'이메일과 8자 이상의 초기 비밀번호가 필요합니다.'},400);
   const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});if(error||!data.user)return respond({error:error?.message||'계정 생성 실패'},400);
   const {error:insertError}=await admin.from('tt_users').insert({id:data.user.id,email,role,active:true,permissions:role==='admin'?allPermissions():clean(b.permissions)});
   if(insertError){await admin.auth.admin.deleteUser(data.user.id);throw insertError;}
   return respond({ok:true});
  }
  if(!/^[0-9a-f-]{36}$/i.test(String(b.id||'')))return respond({error:'잘못된 사용자 ID'},400);
  const {data:target}=await admin.from('tt_users').select('role,active').eq('id',b.id).single();
  if(!target)return respond({error:'사용자 없음'},404);
  // 관리자 계정의 비밀번호는 다른 관리자만 재설정할 수 있습니다.
  if(action==='reset'&&target.role==='admin'&&b.id===user.id)return respond({error:'본인의 비밀번호는 내 정보에서 변경하세요.'},403);
  if(action==='update'){
   const patch:Record<string,unknown>={};
   if(b.role!==undefined){if(b.role!=='admin'&&b.role!=='user')return respond({error:'잘못된 사용자 구분'},400);patch.role=b.role;}
   if(typeof b.active==='boolean')patch.active=b.active;
   if(b.permissions&&typeof b.permissions==='object')patch.permissions=clean(b.permissions);
   const newRole=String(patch.role||target.role);
   if(newRole==='admin')patch.permissions=allPermissions();
   if(!Object.keys(patch).length)return respond({error:'변경사항 없음'},400);
   // 마지막 활성 관리자를 강등/중지할 수 없고 자기 자신의 관리자 권한도 해제할 수 없습니다.
   if(target.role==='admin'&&(newRole!=='admin'||patch.active===false)){
     if(b.id===user.id)return respond({error:'현재 로그인한 관리자의 권한이나 활성 상태는 변경할 수 없습니다.'},403);
     const {count,error:countError}=await admin.from('tt_users').select('id',{count:'exact',head:true}).eq('role','admin').eq('active',true);
     if(countError)throw countError;
     if((count||0)<=1&&target.active)return respond({error:'마지막 활성 관리자는 강등하거나 중지할 수 없습니다.'},409);
   }
   const {error}=await admin.from('tt_users').update(patch).eq('id',b.id);if(error)throw error;return respond({ok:true});
  }
  if(action==='reset'){
   if(typeof b.password!=='string'||b.password.length<8)return respond({error:'비밀번호는 8자 이상'},400);
   const {error}=await admin.auth.admin.updateUserById(b.id,{password:b.password});if(error)throw error;return respond({ok:true});
  }
  return respond({error:'지원하지 않는 작업'},400);
 }catch(e){return respond({error:String(e instanceof Error?e.message:e)},500)}
});
function clean(input:Record<string,unknown>){return Object.fromEntries(['check_view','check_edit','check_delete','check_export','sync','ai'].map(k=>[k,input?.[k]===true]));}

function allPermissions(){return Object.fromEntries(['check_view','check_edit','check_delete','check_export','sync','ai'].map(k=>[k,true]));}
