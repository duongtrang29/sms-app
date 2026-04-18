-- P0: Enforce strict grade status state machine to protect data integrity.
-- Allowed transitions:
--   DRAFT -> SUBMITTED           (LECTURER, ADMIN)
--   SUBMITTED -> APPROVED        (ADMIN)
--   SUBMITTED -> DRAFT           (ADMIN)
--   APPROVED -> LOCKED           (ADMIN)
--   APPROVED -> DRAFT            (ADMIN)
--   LOCKED -> APPROVED           (ADMIN)
-- Any other transition must be rejected.

create or replace function public.apply_grade_status_transition()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_role text := public.current_user_role();
  v_actor_id uuid := auth.uid();
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if old.status = 'LOCKED' and v_role <> 'ADMIN' then
    raise exception 'Locked grades can only be changed by admin';
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if v_role is null then
    raise exception 'Unable to resolve current user role';
  end if;

  if old.status = 'DRAFT' and new.status = 'SUBMITTED' then
    if v_role not in ('LECTURER', 'ADMIN') then
      raise exception 'Only lecturer or admin can submit grades';
    end if;
    new.submitted_at := timezone('utc', now());
    new.submitted_by := v_actor_id;
  elsif old.status = 'SUBMITTED' and new.status = 'APPROVED' then
    if v_role <> 'ADMIN' then
      raise exception 'Only admin can approve grades';
    end if;
    new.approved_at := timezone('utc', now());
    new.approved_by := v_actor_id;
  elsif old.status = 'SUBMITTED' and new.status = 'DRAFT' then
    if v_role <> 'ADMIN' then
      raise exception 'Only admin can return submitted grades to draft';
    end if;
  elsif old.status = 'APPROVED' and new.status = 'LOCKED' then
    if v_role <> 'ADMIN' then
      raise exception 'Only admin can lock grades';
    end if;
    new.locked_at := timezone('utc', now());
    new.locked_by := v_actor_id;
  elsif old.status = 'APPROVED' and new.status = 'DRAFT' then
    if v_role <> 'ADMIN' then
      raise exception 'Only admin can move approved grades to draft';
    end if;
    new.approved_at := null;
    new.approved_by := null;
    new.locked_at := null;
    new.locked_by := null;
  elsif old.status = 'LOCKED' and new.status = 'APPROVED' then
    if v_role <> 'ADMIN' then
      raise exception 'Only admin can unlock grades';
    end if;
    new.locked_at := null;
    new.locked_by := null;
  else
    raise exception 'Unsupported grade status transition: % -> %', old.status, new.status;
  end if;

  return new;
end;
$$;
