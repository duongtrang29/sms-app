-- P2 security hardening: scope student visibility of lecturer profiles
-- to lecturers attached to offerings the student has actually enrolled in.

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
      from public.enrollments e
      join public.teaching_assignments ta on ta.course_offering_id = e.course_offering_id
      where e.student_id = auth.uid()
        and e.status = 'ENROLLED'
        and ta.lecturer_id = profiles.id
    )
  )
);
