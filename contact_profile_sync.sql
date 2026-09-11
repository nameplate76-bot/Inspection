-- v10 연락처 동기화 및 관리자 권한 보정
-- Supabase SQL Editor에서 한 번 실행합니다.

alter table public.pjt_profiles add column if not exists name text;
alter table public.pjt_profiles add column if not exists email text;
alter table public.pjt_profiles add column if not exists phone text;

-- 기존 회원의 인증 이메일·이름·휴대전화번호를 관리자 화면용 프로필에 채웁니다.
update public.pjt_profiles p
set email = u.email,
    name = coalesce(nullif(u.raw_user_meta_data ->> 'name',''), p.name),
    phone = coalesce(nullif(u.raw_user_meta_data ->> 'phone',''), p.phone)
from auth.users u
where p.id = u.id;

-- 신규 가입 및 내 정보 변경 내용을 pjt_profiles에 자동 반영합니다.
create or replace function private_sync_pjt_profile_contact()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.pjt_profiles
     set email = new.email,
         name = coalesce(nullif(new.raw_user_meta_data ->> 'name',''), name),
         phone = coalesce(nullif(new.raw_user_meta_data ->> 'phone',''), phone),
         updated_at = now()
   where id = new.id;
  return new;
end;
$$;

revoke all on function private_sync_pjt_profile_contact() from public, anon, authenticated;
drop trigger if exists zzz_sync_pjt_profile_contact on auth.users;
create trigger zzz_sync_pjt_profile_contact
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function private_sync_pjt_profile_contact();

-- 관리자는 저장된 개별 값과 관계없이 모든 업무 권한을 갖도록 보정합니다.
create or replace function public.enforce_pjt_admin_permissions()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role = 'admin' then
    new.can_view_sales_work := true;
    new.can_create_sales_work := true;
    new.can_edit_sales_work := true;
    new.can_view_inspection := true;
    new.can_create_inspection := true;
    new.can_edit_inspection := true;
    new.can_view_report := true;
    new.can_view_money := true;
    new.can_view_sales := true;
    new.can_print_sales := true;
    new.can_view_management := true;
    new.can_create_management := true;
    new.can_edit_management := true;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_pjt_admin_permissions_trigger on public.pjt_profiles;
create trigger enforce_pjt_admin_permissions_trigger
before insert or update on public.pjt_profiles
for each row execute function public.enforce_pjt_admin_permissions();

update public.pjt_profiles
set can_view_sales_work=true,
    can_create_sales_work=true,
    can_edit_sales_work=true,
    can_view_inspection=true,
    can_create_inspection=true,
    can_edit_inspection=true,
    can_view_report=true,
    can_view_money=true,
    can_view_sales=true,
    can_print_sales=true,
    can_view_management=true,
    can_create_management=true,
    can_edit_management=true
where role='admin';
