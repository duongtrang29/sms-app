create or replace function public.can_student_view_offering(p_offering_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.course_offerings co
    where co.id = p_offering_id
      and (
        co.status = 'OPEN'
        or exists (
          select 1
          from public.enrollments e
          where e.course_offering_id = co.id
            and e.student_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.can_read_course_offering(p_offering_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_admin()
    or (
      public.current_user_role() = 'LECTURER'
      and exists (
        select 1
        from public.teaching_assignments ta
        where ta.course_offering_id = p_offering_id
          and ta.lecturer_id = auth.uid()
      )
    )
    or (
      public.current_user_role() = 'STUDENT'
      and public.can_student_view_offering(p_offering_id)
    ),
    false
  );
$$;

grant execute on function public.can_student_view_offering(uuid) to authenticated;
grant execute on function public.can_read_course_offering(uuid) to authenticated;

drop policy if exists profiles_select_self_or_admin on public.profiles;
drop policy if exists profiles_select_scoped on public.profiles;
create policy profiles_select_scoped
on public.profiles
for select
to authenticated
using (
  public.is_admin()
  or auth.uid() = id
  or (
    public.current_user_role() = 'LECTURER'
    and exists (
      select 1
      from public.enrollments e
      join public.teaching_assignments ta on ta.course_offering_id = e.course_offering_id
      where e.student_id = profiles.id
        and ta.lecturer_id = auth.uid()
    )
  )
  or (
    public.current_user_role() = 'STUDENT'
    and exists (
      select 1
      from public.teaching_assignments ta
      where ta.lecturer_id = profiles.id
        and public.can_read_course_offering(ta.course_offering_id)
    )
  )
);

drop policy if exists lecturers_select_policy on public.lecturers;
create policy lecturers_select_policy
on public.lecturers
for select
to authenticated
using (
  public.is_admin()
  or auth.uid() = id
  or exists (
    select 1
    from public.teaching_assignments ta
    where ta.lecturer_id = lecturers.id
      and public.can_read_course_offering(ta.course_offering_id)
  )
);

drop policy if exists read_course_offerings_authenticated on public.course_offerings;
create policy read_course_offerings_authenticated
on public.course_offerings
for select
to authenticated
using (public.can_read_course_offering(id));

drop policy if exists read_teaching_assignments_authenticated on public.teaching_assignments;
create policy read_teaching_assignments_authenticated
on public.teaching_assignments
for select
to authenticated
using (public.can_read_course_offering(course_offering_id));

drop policy if exists read_schedules_authenticated on public.schedules;
create policy read_schedules_authenticated
on public.schedules
for select
to authenticated
using (public.can_read_course_offering(course_offering_id));
