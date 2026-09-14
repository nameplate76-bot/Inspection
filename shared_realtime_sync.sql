-- PC·휴대폰·다른 PC 간 업무자료 실시간 공유용 공통 저장소
-- Supabase SQL Editor에서 프로젝트 관리자 권한으로 한 번 실행합니다.

create table if not exists public.pjt_shared_state (
  scope text not null default 'company',
  data_key text not null,
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (scope, data_key)
);

alter table public.pjt_shared_state enable row level security;
alter table public.pjt_shared_state replica identity full;

drop policy if exists "approved users read shared state" on public.pjt_shared_state;
create policy "approved users read shared state"
on public.pjt_shared_state for select
to authenticated
using (
  exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid()) and p.approved = true
  )
);

drop policy if exists "approved users insert shared state" on public.pjt_shared_state;
create policy "approved users insert shared state"
on public.pjt_shared_state for insert
to authenticated
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid()) and p.approved = true
  )
);

drop policy if exists "approved users update shared state" on public.pjt_shared_state;
create policy "approved users update shared state"
on public.pjt_shared_state for update
to authenticated
using (
  exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid()) and p.approved = true
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid()) and p.approved = true
  )
);

grant select, insert, update on public.pjt_shared_state to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pjt_shared_state'
  ) then
    alter publication supabase_realtime add table public.pjt_shared_state;
  end if;
end $$;

