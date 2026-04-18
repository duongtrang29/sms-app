import { spawnSync } from "node:child_process";

type QueryRow = Record<string, unknown>;

function runCommand(command: string, args: string[], description: string) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    const details = [stderr, stdout].filter(Boolean).join("\n");
    throw new Error(
      `${description} thất bại.\nLệnh: ${command} ${args.join(" ")}\n${details}`,
    );
  }

  return result.stdout.trim();
}

function parseRows(stdout: string): QueryRow[] {
  const parsed = JSON.parse(stdout) as unknown;

  if (Array.isArray(parsed)) {
    return parsed as QueryRow[];
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    "data" in parsed &&
    Array.isArray((parsed as { data?: unknown }).data)
  ) {
    return (parsed as { data: QueryRow[] }).data;
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    "rows" in parsed &&
    Array.isArray((parsed as { rows?: unknown }).rows)
  ) {
    return (parsed as { rows: QueryRow[] }).rows;
  }

  throw new Error(`Không parse được output JSON từ supabase db query: ${stdout}`);
}

function query(sql: string) {
  const stdout = runCommand(
    "supabase",
    ["--agent=no", "db", "query", "--local", "--output", "json", sql],
    "Truy vấn SQL verification",
  );
  return parseRows(stdout);
}

function getSingleNumber(rows: QueryRow[], field: string) {
  const value = rows[0]?.[field];
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  throw new Error(`Giá trị ${field} không phải số hợp lệ: ${JSON.stringify(rows[0])}`);
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function runSqlVerification() {
  const tableRows = query(`
    select count(*)::int as table_count
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE';
  `);
  const tableCount = getSingleNumber(tableRows, "table_count");
  assert(tableCount === 19, `Kỳ vọng 19 bảng public, thực tế: ${tableCount}`);

  const reportStatusRows = query(`
    select count(*)::int as report_status_columns
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'report_status';
  `);
  const reportStatusColumns = getSingleNumber(
    reportStatusRows,
    "report_status_columns",
  );
  assert(
    reportStatusColumns === 0,
    `Không được tồn tại cột report_status, thực tế: ${reportStatusColumns}`,
  );

  const fkRows = query(`
    select pg_get_constraintdef(c.oid) as constraint_def
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'enrollments'
      and c.conname = 'enrollments_student_id_fkey';
  `);
  const fkDef = String(fkRows[0]?.constraint_def ?? "");
  assert(
    fkDef.toUpperCase().includes("ON DELETE RESTRICT"),
    `FK enrollments.student_id phải ON DELETE RESTRICT, thực tế: ${fkDef}`,
  );

  const overlapRows = query(`
    select count(*)::int as overlap_constraints
    from pg_constraint
    where conname = 'schedules_room_overlap_excl';
  `);
  const overlapConstraintCount = getSingleNumber(
    overlapRows,
    "overlap_constraints",
  );
  assert(
    overlapConstraintCount === 1,
    "Thiếu exclusion constraint schedules_room_overlap_excl",
  );

  const registerOverloadRows = query(`
    select count(*)::int as overloaded_count
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'register_enrollment'
      and oidvectortypes(p.proargtypes) = 'uuid, uuid';
  `);
  const registerOverloadCount = getSingleNumber(
    registerOverloadRows,
    "overloaded_count",
  );
  assert(
    registerOverloadCount === 0,
    "Không được tồn tại overload register_enrollment(uuid, uuid)",
  );

  const cancelOverloadRows = query(`
    select count(*)::int as overloaded_count
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'cancel_enrollment'
      and oidvectortypes(p.proargtypes) = 'uuid, uuid, text';
  `);
  const cancelOverloadCount = getSingleNumber(
    cancelOverloadRows,
    "overloaded_count",
  );
  assert(
    cancelOverloadCount === 0,
    "Không được tồn tại overload cancel_enrollment(uuid, uuid, text)",
  );

  const auditAuthRows = query(`
    select has_function_privilege(
      'authenticated',
      'public.log_audit_event(text,text,text,uuid,jsonb)',
      'EXECUTE'
    ) as auth_can_execute;
  `);
  const authCanExecuteAudit = Boolean(auditAuthRows[0]?.auth_can_execute);
  assert(
    authCanExecuteAudit === false,
    "Role authenticated không được execute trực tiếp log_audit_event",
  );

  const auditServiceRows = query(`
    select has_function_privilege(
      'service_role',
      'public.log_audit_event(text,text,text,uuid,jsonb)',
      'EXECUTE'
    ) as service_can_execute;
  `);
  const serviceCanExecuteAudit = Boolean(auditServiceRows[0]?.service_can_execute);
  assert(
    serviceCanExecuteAudit === true,
    "Role service_role phải execute được log_audit_event",
  );

  const regradeTriggerRows = query(`
    select count(*)::int as trigger_count
    from pg_trigger
    where tgrelid = 'public.regrade_requests'::regclass
      and tgname = 'regrade_requests_apply_status_transition'
      and not tgisinternal;
  `);
  const regradeTriggerCount = getSingleNumber(regradeTriggerRows, "trigger_count");
  assert(
    regradeTriggerCount === 1,
    "Thiếu trigger regrade_requests_apply_status_transition",
  );
}

function main() {
  runCommand(
    "supabase",
    ["db", "reset", "--local", "--yes"],
    "Reset local database theo canonical SQL",
  );

  runSqlVerification();
  console.log("SQL local integration verification: PASS");
}

main();
