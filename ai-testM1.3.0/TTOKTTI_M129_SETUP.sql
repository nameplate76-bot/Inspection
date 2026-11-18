-- Execute only on the isolated AI TEST Supabase project, after reviewing backups.
create table if not exists public.tt_users (
 id uuid primary key references auth.users(id) on delete cascade,
 email text not null,
 role text not null default 'user' check(role in ('admin','user')),
 active boolean not null default true,
 permissions jsonb not null default '{"check_view":true,"check_edit":false,"check_export":false,"sync":false,"ai":false}'::jsonb,
 created_at timestamptz not null default now()
);
alter table public.tt_users enable row level security;
revoke all on public.tt_users from anon;
grant select on public.tt_users to authenticated;
drop policy if exists tt_users_self_read on public.tt_users;
create policy tt_users_self_read on public.tt_users for select to authenticated using (id=auth.uid());
-- No direct INSERT/UPDATE/DELETE policies: admin function uses service role only.
-- Existing sync SQL must be reviewed and applied to this SAME test project before use.
-- First administrator bootstrap: create Auth user in Dashboard, then manually run:
-- insert into public.tt_users(id,email,role,active,permissions)
-- select id,email,'admin',true,'{}'::jsonb from auth.users where email='REPLACE_ADMIN_EMAIL'
-- on conflict(id) do update set role='admin',active=true;

-- On isolated test project only: replace old pjt_profiles-based sync policies.
-- Run after creating the sync table using the original setup script, not before.
drop policy if exists "m103_select_approved_own" on public.pjt_performance_test_docs_v1;
drop policy if exists "m103_insert_approved_own" on public.pjt_performance_test_docs_v1;
drop policy if exists "m103_update_approved_own" on public.pjt_performance_test_docs_v1;
create policy tt_sync_read on public.pjt_performance_test_docs_v1 for select to authenticated using (owner_id=auth.uid() and exists(select 1 from public.tt_users where id=auth.uid() and active and (role='admin' or permissions->>'sync'='true')));
create policy tt_sync_insert on public.pjt_performance_test_docs_v1 for insert to authenticated with check (owner_id=auth.uid() and exists(select 1 from public.tt_users where id=auth.uid() and active and (role='admin' or permissions->>'sync'='true')));
create policy tt_sync_update on public.pjt_performance_test_docs_v1 for update to authenticated using (owner_id=auth.uid() and exists(select 1 from public.tt_users where id=auth.uid() and active and (role='admin' or permissions->>'sync'='true'))) with check (owner_id=auth.uid() and exists(select 1 from public.tt_users where id=auth.uid() and active and (role='admin' or permissions->>'sync'='true')));
