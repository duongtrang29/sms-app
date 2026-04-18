-- P1: Harden audit logging RPC to prevent arbitrary writes from authenticated users.
-- Strategy:
-- - Validate actor and role from current session.
-- - Restrict accepted action names by role-specific whitelist.
-- - Restrict entity_type whitelist.
-- - Cap metadata payload size.

create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_target_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log_id bigint;
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_action text := upper(trim(coalesce(p_action, '')));
  v_entity_type text := lower(trim(coalesce(p_entity_type, '')));
  v_allowed_actions text[];
begin
  if v_actor_id is null then
    raise exception 'Authentication required for audit logging';
  end if;

  select p.role_code
  into v_actor_role
  from public.profiles p
  where p.id = v_actor_id
    and p.status = 'ACTIVE'
  limit 1;

  if v_actor_role is null then
    raise exception 'Active actor profile is required for audit logging';
  end if;

  if v_action = '' or v_action !~ '^[A-Z0-9_]{3,80}$' then
    raise exception 'Invalid audit action';
  end if;

  if v_entity_type not in (
    'academic_classes',
    'auth',
    'course_offerings',
    'courses',
    'departments',
    'enrollments',
    'grades',
    'lecturers',
    'majors',
    'profiles',
    'regrade_requests',
    'rooms',
    'schedules',
    'semesters',
    'students'
  ) then
    raise exception 'Invalid audit entity_type';
  end if;

  if pg_column_size(coalesce(p_metadata, '{}'::jsonb)) > 16384 then
    raise exception 'Audit metadata payload is too large';
  end if;

  if v_actor_role = 'STUDENT' then
    v_allowed_actions := array[
      'AUTH_LOGIN',
      'PASSWORD_RESET',
      'PROFILE_UPDATED',
      'ENROLLMENT_REGISTER_TRIGGERED',
      'ENROLLMENT_CANCEL_TRIGGERED',
      'ENROLLMENT_REGISTERED',
      'ENROLLMENT_DROPPED',
      'REGRADE_REQUEST_CREATED'
    ];
  elsif v_actor_role = 'LECTURER' then
    v_allowed_actions := array[
      'AUTH_LOGIN',
      'PASSWORD_RESET',
      'PROFILE_UPDATED',
      'GRADE_SAVED',
      'GRADE_SHEET_SUBMITTED',
      'REGRADE_REQUEST_RESOLVED'
    ];
  elsif v_actor_role = 'ADMIN' then
    v_allowed_actions := array[
      'ACADEMIC_CLASS_UPDATED',
      'ACADEMIC_CLASS_CREATED',
      'ACADEMIC_CLASS_ACTIVATED',
      'ACADEMIC_CLASS_DEACTIVATED',
      'AUTH_LOGIN',
      'PASSWORD_RESET',
      'COURSE_OFFERING_UPDATED',
      'COURSE_OFFERING_CREATED',
      'COURSE_OFFERING_DELETED',
      'COURSE_UPDATED',
      'COURSE_CREATED',
      'COURSE_DELETED',
      'DEPARTMENT_UPDATED',
      'DEPARTMENT_CREATED',
      'DEPARTMENT_DELETED',
      'ENROLLMENT_REGISTER_TRIGGERED',
      'ENROLLMENT_CANCEL_TRIGGERED',
      'ENROLLMENT_REGISTERED',
      'ENROLLMENT_DROPPED',
      'GRADE_STATUS_CHANGED',
      'GRADE_BATCH_STATUS_CHANGED',
      'GRADE_SAVED',
      'GRADE_SHEET_SUBMITTED',
      'LECTURER_UPDATED',
      'LECTURER_CREATED',
      'LECTURER_ACTIVATED',
      'LECTURER_DEACTIVATED',
      'MAJOR_UPDATED',
      'MAJOR_CREATED',
      'MAJOR_ACTIVATED',
      'MAJOR_DEACTIVATED',
      'PROFILE_UPDATED',
      'REGRADE_REQUEST_CREATED',
      'REGRADE_REQUEST_RESOLVED',
      'ROOM_UPDATED',
      'ROOM_CREATED',
      'ROOM_ACTIVATED',
      'ROOM_DEACTIVATED',
      'SCHEDULE_UPDATED',
      'SCHEDULE_CREATED',
      'SEMESTER_UPDATED',
      'SEMESTER_CREATED',
      'SEMESTER_DELETED',
      'STUDENT_UPDATED',
      'STUDENT_CREATED',
      'STUDENT_ACTIVATED',
      'STUDENT_DEACTIVATED',
      'USER_PROVISIONED',
      'USER_UPDATED'
    ];
  else
    raise exception 'Unsupported role for audit logging';
  end if;

  if not (v_action = any(v_allowed_actions)) then
    raise exception 'Audit action "%" is not allowed for role "%"', v_action, v_actor_role;
  end if;

  insert into public.audit_logs (
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    target_user_id,
    metadata
  )
  values (
    v_actor_id,
    v_actor_role,
    v_action,
    v_entity_type,
    p_entity_id,
    p_target_user_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;

revoke execute on function public.log_audit_event(text, text, text, uuid, jsonb) from public;
grant execute on function public.log_audit_event(text, text, text, uuid, jsonb) to authenticated;
grant execute on function public.log_audit_event(text, text, text, uuid, jsonb) to service_role;
