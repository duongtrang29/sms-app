-- Migration: sync schema with report (step 2B)
-- NGUYEN TAC: only additive/backward-compatible changes.
-- KHONG DROP table/cot dang co du lieu.

-- Ghi chu: Van de "0001_init_sms.sql bi lap block CREATE TABLE" la van de lich su file migration.
-- Khong the sua bang mot migration additive moi, nen chi danh dau de team cleanup tai file lich su neu can.

-- =====================================================================
-- 2) THEM COT THIEU / COT TUONG THICH VOI BAO CAO
-- =====================================================================

-- Them cot id cho course_prerequisites: dong bo voi Bang 4.1 trong bao cao final
-- (giu nguyen PK ghep hien tai de backward-compatible, bo sung surrogate key duy nhat).
alter table public.course_prerequisites
  add column if not exists id uuid;

update public.course_prerequisites
set id = gen_random_uuid()
where id is null;

alter table public.course_prerequisites
  alter column id set default gen_random_uuid();

alter table public.course_prerequisites
  alter column id set not null;

create unique index if not exists course_prerequisites_id_key
  on public.course_prerequisites (id);

-- Them cot report_status cho enrollments: dong bo vocabulary status voi bao cao final
-- (REGISTERED/CANCELLED), trong khi van giu cot status goc de khong pha vo nghiep vu hien tai.
alter table public.enrollments
  add column if not exists report_status text;

update public.enrollments
set report_status = case
  when status = 'ENROLLED'::enrollment_status then 'REGISTERED'
  when status = 'DROPPED'::enrollment_status then 'CANCELLED'
  else status::text
end
where report_status is distinct from case
  when status = 'ENROLLED'::enrollment_status then 'REGISTERED'
  when status = 'DROPPED'::enrollment_status then 'CANCELLED'
  else status::text
end;

create or replace function public.sync_enrollments_report_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.report_status := case
    when new.status = 'ENROLLED'::enrollment_status then 'REGISTERED'
    when new.status = 'DROPPED'::enrollment_status then 'CANCELLED'
    else new.status::text
  end;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'enrollments_sync_report_status'
      and tgrelid = 'public.enrollments'::regclass
      and not tgisinternal
  ) then
    create trigger enrollments_sync_report_status
    before insert or update of status
    on public.enrollments
    for each row
    execute function public.sync_enrollments_report_status();
  end if;
end $$;

-- Them cot report_status cho regrade_requests: dong bo status REVIEWING trong bao cao final.
alter table public.regrade_requests
  add column if not exists report_status text;

update public.regrade_requests
set report_status = case
  when status = 'UNDER_REVIEW'::regrade_status then 'REVIEWING'
  else status::text
end
where report_status is distinct from case
  when status = 'UNDER_REVIEW'::regrade_status then 'REVIEWING'
  else status::text
end;

create or replace function public.sync_regrade_requests_report_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.report_status := case
    when new.status = 'UNDER_REVIEW'::regrade_status then 'REVIEWING'
    else new.status::text
  end;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'regrade_requests_sync_report_status'
      and tgrelid = 'public.regrade_requests'::regclass
      and not tgisinternal
  ) then
    create trigger regrade_requests_sync_report_status
    before insert or update of status
    on public.regrade_requests
    for each row
    execute function public.sync_regrade_requests_report_status();
  end if;
end $$;

-- =====================================================================
-- 3) THEM HAM THIEU (OVERLOAD) THEO BAO CAO
-- =====================================================================

-- Them ham register_enrollment(p_student_id uuid, p_offering_id uuid):
-- dong bo signature voi bao cao final, delegate ve ham hien tai de giu logic nghiep vu.
create or replace function public.register_enrollment(
  p_student_id uuid,
  p_offering_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_student_id is null or p_offering_id is null then
    raise exception 'p_student_id and p_offering_id are required';
  end if;

  if p_student_id <> v_actor_id then
    raise exception 'p_student_id must match authenticated user';
  end if;

  return public.register_enrollment(p_offering_id);
end;
$$;

grant execute on function public.register_enrollment(uuid, uuid) to authenticated;

-- Them ham cancel_enrollment(p_student_id uuid, p_offering_id uuid, p_reason text):
-- dong bo signature voi bao cao final, delegate ve ham hien tai theo enrollment_id.
create or replace function public.cancel_enrollment(
  p_student_id uuid,
  p_offering_id uuid,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_enrollment_id uuid;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_student_id is null or p_offering_id is null then
    raise exception 'p_student_id and p_offering_id are required';
  end if;

  if not public.is_admin() and p_student_id <> v_actor_id then
    raise exception 'You can only cancel your own enrollment';
  end if;

  select e.id
  into v_enrollment_id
  from public.enrollments e
  where e.student_id = p_student_id
    and e.course_offering_id = p_offering_id
    and e.status = 'ENROLLED'::enrollment_status
  order by e.created_at desc
  limit 1;

  if v_enrollment_id is null then
    raise exception 'Enrollment not found for this student and offering';
  end if;

  return public.cancel_enrollment(v_enrollment_id, p_reason);
end;
$$;

grant execute on function public.cancel_enrollment(uuid, uuid, text) to authenticated;

-- =====================================================================
-- 4) THEM TRIGGER THIEU (TEN DONG BO BAO CAO)
-- =====================================================================

-- Them trigger alias "recompute_grade_derived_fields": dong bo ten trigger voi bao cao final.
-- Dung WHEN (false) de khong thay doi hanh vi vi trigger goc da ton tai (grades_recompute_fields).
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'recompute_grade_derived_fields'
      and tgrelid = 'public.grades'::regclass
      and not tgisinternal
  ) then
    create trigger recompute_grade_derived_fields
    before insert or update
    on public.grades
    for each row
    when (false)
    execute function public.recompute_grade_derived_fields();
  end if;
end $$;

-- Them trigger alias "apply_grade_status_transition": dong bo ten trigger voi bao cao final.
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'apply_grade_status_transition'
      and tgrelid = 'public.grades'::regclass
      and not tgisinternal
  ) then
    create trigger apply_grade_status_transition
    before update
    on public.grades
    for each row
    when (false)
    execute function public.apply_grade_status_transition();
  end if;
end $$;

-- Them trigger alias "log_grade_change": dong bo ten trigger voi bao cao final.
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'log_grade_change'
      and tgrelid = 'public.grades'::regclass
      and not tgisinternal
  ) then
    create trigger log_grade_change
    after update
    on public.grades
    for each row
    when (false)
    execute function public.log_grade_change();
  end if;
end $$;

-- =====================================================================
-- 5) RLS POLICY THIEU
-- =====================================================================
-- Khong co policy thieu theo ket qua 2A; khong them policy moi trong migration nay.
