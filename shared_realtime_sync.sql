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

-- 이전 버전이 사진 포함 보고서 전체를 JSONB 행에 넣다가 시간 초과된 흔적을 제거합니다.
-- 실제 최신 보고서는 사용 중인 PC의 IndexedDB에 그대로 남아 있으며 새 버전 접속 시 파일 저장소로 이관됩니다.
delete from public.pjt_shared_state
where scope = 'company'
  and data_key = 'performance-report-v2'
  and (data ? 'equipment' or pg_column_size(data) > 1048576);

alter table public.pjt_shared_state enable row level security;
alter table public.pjt_shared_state replica identity full;

drop policy if exists "approved users read shared state" on public.pjt_shared_state;
create policy "approved users read shared state"
on public.pjt_shared_state for select
to authenticated
using ((select
  exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid()) and p.approved = true
  )
));

drop policy if exists "approved users insert shared state" on public.pjt_shared_state;
create policy "approved users insert shared state"
on public.pjt_shared_state for insert
to authenticated
with check (
  updated_by = (select auth.uid())
  and (select exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid()) and p.approved = true
  ))
);

drop policy if exists "approved users update shared state" on public.pjt_shared_state;
create policy "approved users update shared state"
on public.pjt_shared_state for update
to authenticated
using ((select
  exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid()) and p.approved = true
  )
))
with check (
  updated_by = (select auth.uid())
  and (select exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid()) and p.approved = true
  ))
);

grant select, insert, update on public.pjt_shared_state to authenticated;

-- 사진이 포함된 성능점검 보고서는 큰 JSONB로 처리하지 않고 전용 비공개 파일로 저장합니다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pjt-report-data', 'pjt-report-data', false, 104857600, array['application/json'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "approved users read report files" on storage.objects;
create policy "approved users read report files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'pjt-report-data'
  and (select exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid()) and p.approved = true
  ))
);

drop policy if exists "approved users insert report files" on storage.objects;
create policy "approved users insert report files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'pjt-report-data'
  and (select exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid()) and p.approved = true
  ))
);

drop policy if exists "approved users update report files" on storage.objects;
create policy "approved users update report files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'pjt-report-data'
  and (select exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid()) and p.approved = true
  ))
)
with check (
  bucket_id = 'pjt-report-data'
  and (select exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid()) and p.approved = true
  ))
);

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
