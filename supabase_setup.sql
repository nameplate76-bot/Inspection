-- Supabase SQL Editor에서 1회 실행
create table if not exists public.projects (
  id text primary key,
  site_name text not null default '',
  client text default '',
  pm text default '',
  inspector text default '',
  reporter text default '',
  contract_date date,
  inspection_date date,
  due_date date,
  status text default '예정',
  progress integer default 0 check (progress between 0 and 100),
  phone text default '',
  address text default '',
  memo text default '',
  extra jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- 사내 테스트용 간단 정책:
-- anon key로 조회/입력/수정/삭제 가능.
-- 실제 운영 전에는 Supabase Auth를 연결하여 직원 로그인 기반 정책으로 강화하는 것을 권장.
drop policy if exists "anon select projects" on public.projects;
drop policy if exists "anon insert projects" on public.projects;
drop policy if exists "anon update projects" on public.projects;
drop policy if exists "anon delete projects" on public.projects;

create policy "anon select projects" on public.projects for select to anon using (true);
create policy "anon insert projects" on public.projects for insert to anon with check (true);
create policy "anon update projects" on public.projects for update to anon using (true) with check (true);
create policy "anon delete projects" on public.projects for delete to anon using (true);
