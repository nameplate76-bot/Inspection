// Supabase Edge Function. Uses only server environment secrets; never place them in HTML.
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const permissionKeys=['can_view_sales_work','can_create_sales_work','can_edit_sales_work','can_view_inspection','can_create_inspection','can_edit_inspection','can_view_report','can_view_money','can_view_sales','can_print_sales','can_view_management','can_create_management','can_edit_management'];
Deno.serve(async(req:Request)=>{
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});if(req.method!=='POST')return reply({error:'POST required'},405);
 try{
 const url=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const api=async(path:string,method='GET',body?:unknown,token=key)=>{const response=await fetch(url+path,{method,headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});const data=await response.json().catch(()=>null);if(!response.ok)throw Error(data?.msg||data?.message||data?.error_description||'서버 요청 실패');return data};
 const token=(req.headers.get('Authorization')||'').replace(/^Bearer /i,'');if(!token)return reply({error:'로그인이 필요합니다.'},401);
 const caller=await api('/auth/v1/user','GET',undefined,token);const profiles=await api('/rest/v1/pjt_profiles?id=eq.'+encodeURIComponent(caller.id)+'&select=id,role,approved');if(profiles[0]?.role!=='admin'||!profiles[0]?.approved)return reply({error:'승인된 관리자만 사용할 수 있습니다.'},403);
 const b=await req.json();
 if(b.action==='list'){const result=[];for(let offset=0;;offset+=500){const rows=await api('/rest/v1/pjt_profiles?select=*&order=id&limit=500&offset='+offset);result.push(...rows);if(rows.length<500)break}const users=new Map();for(let page=1;;page++){const data=await api('/auth/v1/admin/users?page='+page+'&per_page=500');for(const u of data.users||[])users.set(u.id,u);if((data.users||[]).length<500)break}return reply({users:result.map(p=>({...p,name:users.get(p.id)?.user_metadata?.name||'',email:users.get(p.id)?.email||p.email||''}))})}
 if(b.action!=='save')return reply({error:'지원하지 않는 작업입니다.'},400);
 const name=String(b.name||'').trim(),userId=String(b.user_id||'').trim(),password=String(b.password||'');if(!name||userId.length<4||(password&&password.length<6))return reply({error:'이름, ID(4자 이상), 비밀번호(입력 시 6자 이상)를 확인하세요.'},400);
 const patch:Record<string,unknown>={approved:b.approved===true,role:b.role==='admin'?'admin':'viewer',updated_at:new Date().toISOString()};for(const k of permissionKeys)patch[k]=b[k]===true;
 let id=String(b.id||'');if(id){const rows=await api('/rest/v1/pjt_profiles?id=eq.'+encodeURIComponent(id)+'&select=*');const old=rows[0];if(!old||old.user_id!==userId)return reply({error:'사용자 ID가 일치하지 않습니다. 목록을 다시 여세요.'},400);if(old.role==='admin'&&(!patch.approved||patch.role!=='admin'))return reply({error:'기존 관리자 계정의 승인과 관리자 역할은 이 화면에서 해제할 수 없습니다.'},400);
 // Store profile first, and report explicitly if the subsequent Auth change fails.
 await api('/rest/v1/pjt_profiles?id=eq.'+encodeURIComponent(id),'PATCH',patch);
 try{await api('/auth/v1/admin/users/'+encodeURIComponent(id),'PUT',{user_metadata:{name},...(password?{password}:{})})}catch(e){return reply({error:'권한은 저장되었으나 이름/비밀번호 변경에 실패했습니다. 다시 저장하세요: '+(e as Error).message},409)}
 }else{const email=String(b.email||'').trim();if(!email.includes('@')||password.length<6)return reply({error:'신규 서버 계정에는 이메일과 6자 이상의 비밀번호가 필요합니다.'},400);const duplicate=await api('/rest/v1/pjt_profiles?user_id=eq.'+encodeURIComponent(userId)+'&select=id');if(duplicate.length)return reply({error:'이미 사용 중인 ID입니다.'},409);const created=await api('/auth/v1/admin/users','POST',{email,password,email_confirm:true,user_metadata:{user_id:userId,name}});id=created.id;try{const rows=await api('/rest/v1/pjt_profiles?id=eq.'+encodeURIComponent(id),'PATCH',{...patch,user_id:userId});if(!rows.length)throw Error('기존 회원가입의 pjt_profiles 생성 트리거가 필요합니다.')}catch(e){await api('/auth/v1/admin/users/'+encodeURIComponent(id),'DELETE');throw e}}
 return reply({ok:true,id});
 }catch(e){return reply({error:(e as Error).message},400)}
});
