-- P1: Preserve enrollment/grade history by preventing student hard-delete cascades.
-- Change FK behavior from ON DELETE CASCADE to ON DELETE RESTRICT.

alter table public.enrollments
  drop constraint if exists enrollments_student_id_fkey;

alter table public.enrollments
  add constraint enrollments_student_id_fkey
  foreign key (student_id)
  references public.students (id)
  on delete restrict;
