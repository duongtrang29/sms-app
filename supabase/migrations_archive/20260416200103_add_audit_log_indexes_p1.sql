-- P1: Add missing audit log indexes for actor/time filtering workloads.

create index if not exists audit_logs_actor_idx
  on public.audit_logs (actor_id);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);
