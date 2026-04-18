-- P2 performance: add missing indexes used by regrade queries.
-- Keep names deterministic for easier monitoring.

create index if not exists idx_regrade_requests_student_id
  on public.regrade_requests (student_id);

create index if not exists idx_regrade_requests_grade_id
  on public.regrade_requests (grade_id);
