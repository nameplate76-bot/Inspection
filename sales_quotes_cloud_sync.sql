-- 견적 자료를 PC와 휴대폰에서 공유하기 위한 중앙 저장 테이블
create table if not exists public.pjt_sales_quotes (
  id text primary key,
  quote_no text not null unique,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.pjt_sales_quotes enable row level security;

create index if not exists pjt_sales_quotes_updated_by_idx
on public.pjt_sales_quotes(updated_by);

grant select, insert, update, delete on public.pjt_sales_quotes to authenticated;
grant select, insert, update, delete on public.pjt_sales_quotes to service_role;

drop policy if exists "sales quotes approved read" on public.pjt_sales_quotes;
create policy "sales quotes approved read"
on public.pjt_sales_quotes for select
to authenticated
using (
  exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid())
      and p.approved
      and (p.role = 'admin' or p.can_view_sales_work or p.can_create_sales_work or p.can_edit_sales_work)
  )
);

drop policy if exists "sales quotes creator insert" on public.pjt_sales_quotes;
create policy "sales quotes creator insert"
on public.pjt_sales_quotes for insert
to authenticated
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid())
      and p.approved
      and (p.role = 'admin' or p.can_create_sales_work)
  )
);

drop policy if exists "sales quotes editor update" on public.pjt_sales_quotes;
create policy "sales quotes editor update"
on public.pjt_sales_quotes for update
to authenticated
using (
  exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid())
      and p.approved
      and (p.role = 'admin' or p.can_edit_sales_work)
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid())
      and p.approved
      and (p.role = 'admin' or p.can_edit_sales_work)
  )
);

drop policy if exists "sales quotes editor delete" on public.pjt_sales_quotes;
create policy "sales quotes editor delete"
on public.pjt_sales_quotes for delete
to authenticated
using (
  exists (
    select 1 from public.pjt_profiles p
    where p.id = (select auth.uid())
      and p.approved
      and (p.role = 'admin' or p.can_edit_sales_work)
  )
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pjt_sales_quotes'
  ) then
    alter publication supabase_realtime add table public.pjt_sales_quotes;
  end if;
end
$$;
