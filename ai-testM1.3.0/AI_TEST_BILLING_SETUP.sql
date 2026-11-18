-- IMPORTANT: Run ONLY in new ttoktticheck-ai-test Supabase project. Not on pjt-progress.
-- Test accounts are managed in this project's Authentication > Users.
create table if not exists public.ttoktti_ai_test_approvals_v1 (
 user_id uuid primary key references auth.users(id) on delete cascade,
 approved boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.ttoktti_ai_test_approvals_v1 enable row level security;
revoke all on public.ttoktti_ai_test_approvals_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.ttoktti_ai_test_approvals_v1 to service_role;
-- Manually approve test users from SQL Editor AFTER creating them in Authentication:
-- insert into public.ttoktti_ai_test_approvals_v1(user_id,approved) values ('REPLACE_TEST_AUTH_USER_UUID',true) on conflict(user_id) do update set approved=true;

-- M1.2.3 : isolated AI TEST quotas only. Review and execute MANUALLY on a TEST Supabase project.
-- No existing business/inspection tables are altered. Never execute on production without a backup and review.
-- Global monthly quota: 1000 calls shared by all accounts; default per-user quota: 30 calls.
-- Credits: 1 credit = one additional AI request, manually granted after verified payment in the future.
create table if not exists public.ttoktti_ai_monthly_global_v1 (
  month_key text primary key check (month_key ~ '^[0-9]{4}-[0-9]{2}$'),
  used_count integer not null default 0 check (used_count >= 0),
  monthly_cap integer not null default 1000 check (monthly_cap between 1 and 1000000)
);
create table if not exists public.ttoktti_ai_monthly_users_v1 (
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null check (month_key ~ '^[0-9]{4}-[0-9]{2}$'),
  used_included integer not null default 0 check (used_included >= 0),
  used_credits integer not null default 0 check (used_credits >= 0),
  included_limit integer not null default 30 check (included_limit between 0 and 100000),
  credit_allowance integer not null default 0 check (credit_allowance between 0 and 100000),
  primary key(user_id,month_key)
);
create table if not exists public.ttoktti_ai_requests_v1 (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null,
  quota_type text not null check(quota_type in ('included','credit')),
  state text not null default 'reserved' check(state in ('reserved','complete','reversed')),
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ttoktti_ai_requests_user_idx on public.ttoktti_ai_requests_v1(user_id,created_at desc);
alter table public.ttoktti_ai_monthly_global_v1 enable row level security;
alter table public.ttoktti_ai_monthly_users_v1 enable row level security;
alter table public.ttoktti_ai_requests_v1 enable row level security;
revoke all on public.ttoktti_ai_monthly_global_v1 from public,anon,authenticated;
revoke all on public.ttoktti_ai_monthly_users_v1 from public,anon,authenticated;
revoke all on public.ttoktti_ai_requests_v1 from public,anon,authenticated;
grant select,insert,update on public.ttoktti_ai_monthly_global_v1 to service_role;
grant select,insert,update on public.ttoktti_ai_monthly_users_v1 to service_role;
grant select,insert,update on public.ttoktti_ai_requests_v1 to service_role;

-- Entry point restricted to service_role. No browser can directly change a quota or create paid credits.
create or replace function public.ttoktti_ai_reserve_v1(p_user uuid,p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  m text := to_char(timezone('Asia/Seoul',now()),'YYYY-MM');
  g public.ttoktti_ai_monthly_global_v1%rowtype;
  u public.ttoktti_ai_monthly_users_v1%rowtype;
  qt text;
begin
  if p_user is null or p_id is null then raise exception 'invalid request'; end if;
  -- One global lock protects all global quota reads/writes; transaction-level and auto releases.
  perform pg_advisory_xact_lock(561144114);
  insert into public.ttoktti_ai_monthly_global_v1(month_key) values (m) on conflict do nothing;
  insert into public.ttoktti_ai_monthly_users_v1(user_id,month_key) values (p_user,m) on conflict do nothing;
  select * into g from public.ttoktti_ai_monthly_global_v1 where month_key=m for update;
  select * into u from public.ttoktti_ai_monthly_users_v1 where user_id=p_user and month_key=m for update;
  if g.used_count >= g.monthly_cap then
    return jsonb_build_object('ok',false,'reason','global_limit','month',m,'global_used',g.used_count,'global_limit',g.monthly_cap);
  end if;
  if u.used_included < u.included_limit then qt:='included';
  elsif u.used_credits < u.credit_allowance then qt:='credit';
  else return jsonb_build_object('ok',false,'reason','user_limit','month',m,'included_used',u.used_included,'included_limit',u.included_limit,'credits_remaining',greatest(0,u.credit_allowance-u.used_credits));
  end if;
  insert into public.ttoktti_ai_requests_v1(id,user_id,month_key,quota_type) values(p_id,p_user,m,qt);
  if qt='included' then
    update public.ttoktti_ai_monthly_users_v1 set used_included=used_included+1 where user_id=p_user and month_key=m;
  else
    update public.ttoktti_ai_monthly_users_v1 set used_credits=used_credits+1 where user_id=p_user and month_key=m;
  end if;
  update public.ttoktti_ai_monthly_global_v1 set used_count=used_count+1 where month_key=m;
  return jsonb_build_object('ok',true,'month',m,'global_remaining',g.monthly_cap-g.used_count-1,'quota_type',qt);
end $$;

create or replace function public.ttoktti_ai_finish_v1(p_user uuid,p_id uuid,p_success boolean,p_input integer default 0,p_output integer default 0)
returns boolean language plpgsql security definer set search_path = '' as $$
declare r public.ttoktti_ai_requests_v1%rowtype;
begin
  perform pg_advisory_xact_lock(561144114);
  select * into r from public.ttoktti_ai_requests_v1 where id=p_id and user_id=p_user for update;
  if not found or r.state <> 'reserved' then return false; end if;
  if p_success then
    update public.ttoktti_ai_requests_v1 set state='complete',input_tokens=greatest(0,coalesce(p_input,0)),output_tokens=greatest(0,coalesce(p_output,0)) where id=p_id;
  else
    update public.ttoktti_ai_requests_v1 set state='reversed' where id=p_id;
    update public.ttoktti_ai_monthly_global_v1 set used_count=greatest(0,used_count-1) where month_key=r.month_key;
    if r.quota_type='credit' then
      update public.ttoktti_ai_monthly_users_v1 set used_credits=greatest(0,used_credits-1) where user_id=p_user and month_key=r.month_key;
    else
      update public.ttoktti_ai_monthly_users_v1 set used_included=greatest(0,used_included-1) where user_id=p_user and month_key=r.month_key;
    end if;
  end if;
  return true;
end $$;
revoke all on function public.ttoktti_ai_reserve_v1(uuid,uuid) from public,anon,authenticated;
revoke all on function public.ttoktti_ai_finish_v1(uuid,uuid,boolean,integer,integer) from public,anon,authenticated;
grant execute on function public.ttoktti_ai_reserve_v1(uuid,uuid) to service_role;
grant execute on function public.ttoktti_ai_finish_v1(uuid,uuid,boolean,integer,integer) to service_role;
-- NOT a payment system: do not sell credits until verified payment webhooks and refund logic are implemented.
-- Example of MANUAL test-only grant, after replacing UUID and month; DO NOT RUN without authorization:
-- update public.ttoktti_ai_monthly_users_v1 set credit_allowance=credit_allowance+10
-- where user_id='USER_UUID' and month_key='2026-11';
