import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { z } from "zod";

import type { Database } from "../src/types/database";

loadEnvConfig(process.cwd());

const envSchema = z.object({
  DEMO_BATCH: z.string().min(1).default("sms-demo-2026"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const env = envSchema.parse({
  DEMO_BATCH: process.env.DEMO_BATCH,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

export const DEMO_BATCH = env.DEMO_BATCH;
export const DEMO_PASSWORD = "Demo@123456";
export const DEMO_MARKER = Object.freeze({
  demo_batch: DEMO_BATCH,
  is_demo: true as const,
});

export type ScriptRole = "ADMIN" | "LECTURER" | "STUDENT";
export type ScriptProfileStatus = "ACTIVE" | "INACTIVE" | "LOCKED";
type DemoTable = keyof Pick<
  Database["public"]["Tables"],
  | "academic_classes"
  | "audit_logs"
  | "course_offerings"
  | "courses"
  | "departments"
  | "enrollments"
  | "grade_change_logs"
  | "grades"
  | "lecturers"
  | "majors"
  | "profiles"
  | "regrade_requests"
  | "rooms"
  | "schedules"
  | "semesters"
  | "students"
  | "teaching_assignments"
>;
type DemoMarkedRow = {
  demo_batch?: string | null;
  is_demo?: boolean;
};

const DEMO_TABLES: DemoTable[] = [
  "audit_logs",
  "regrade_requests",
  "grade_change_logs",
  "grades",
  "enrollments",
  "schedules",
  "teaching_assignments",
  "course_offerings",
  "students",
  "lecturers",
  "academic_classes",
  "majors",
  "courses",
  "rooms",
  "semesters",
  "departments",
  "profiles",
];

export function createServiceRoleClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function unwrapError(error: { message: string } | null, label: string) {
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
}

export function markDemoRow<T extends DemoMarkedRow>(row: T) {
  return {
    ...row,
    ...DEMO_MARKER,
  };
}

export function markDemoRows<T extends DemoMarkedRow>(rows: T[]) {
  return rows.map((row) => markDemoRow(row));
}

async function assertDemoBatchIsolation(
  client: SupabaseClient<Database>,
  table: DemoTable,
) {
  const { count, error } = await client
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("demo_batch", DEMO_BATCH as never)
    .neq("is_demo", true as never);

  unwrapError(error, `Unable to validate demo rows in ${String(table)}`);

  if ((count ?? 0) > 0) {
    throw new Error(
      `Refusing to reset demo batch "${DEMO_BATCH}" because table "${String(table)}" contains non-demo rows with the same batch marker.`,
    );
  }
}

async function deleteMarkedRows(
  client: SupabaseClient<Database>,
  table: DemoTable,
) {
  await assertDemoBatchIsolation(client, table);

  const { error } = await client
    .from(table)
    .delete()
    .eq("demo_batch", DEMO_BATCH as never)
    .eq("is_demo", true as never);

  if (error?.message.includes("violates foreign key constraint")) {
    throw new Error(
      `Unable to delete demo rows from ${String(table)}: ${error.message}. This usually means there are still child rows or mixed live data referencing demo records in this batch.`,
    );
  }

  unwrapError(error, `Unable to delete demo rows from ${String(table)}`);
}

export async function resetDemoData(client = createServiceRoleClient()) {
  const [{ data: profileRows, error: profileError }, { data: courseRows, error: courseError }] =
    await Promise.all([
      client
        .from("profiles")
        .select("id")
        .eq("demo_batch", DEMO_BATCH)
        .eq("is_demo", true),
      client
        .from("courses")
        .select("id")
        .eq("demo_batch", DEMO_BATCH)
        .eq("is_demo", true),
    ]);

  unwrapError(profileError, "Unable to read demo profiles");
  unwrapError(courseError, "Unable to read demo courses");

  const profileIds = ((profileRows as Array<{ id: string }>) ?? []).map(
    (item) => item.id,
  );
  const courseIds = ((courseRows as Array<{ id: string }>) ?? []).map(
    (item) => item.id,
  );

  if (courseIds.length) {
    const { error: courseLinkError } = await client
      .from("course_prerequisites")
      .delete()
      .in("course_id", courseIds as never);
    unwrapError(courseLinkError, "Unable to delete course prerequisite rows");

    const { error: prerequisiteLinkError } = await client
      .from("course_prerequisites")
      .delete()
      .in("prerequisite_course_id", courseIds as never);
    unwrapError(
      prerequisiteLinkError,
      "Unable to delete prerequisite reverse links",
    );
  }

  for (const table of DEMO_TABLES.filter((table) => table !== "profiles")) {
    await deleteMarkedRows(client, table);
  }

  for (const profileId of profileIds) {
    const { error } = await client.auth.admin.deleteUser(profileId);
    if (error && !error.message.includes("User not found")) {
      throw new Error(`Unable to delete auth user ${profileId}: ${error.message}`);
    }
  }

  const { error: leftoverProfileError } = await client
    .from("profiles")
    .delete()
    .eq("demo_batch", DEMO_BATCH)
    .eq("is_demo", true);

  unwrapError(leftoverProfileError, "Unable to delete remaining demo profiles");

  return {
    deletedCourseCount: courseIds.length,
    deletedProfileCount: profileIds.length,
  };
}

type CreateDemoUserInput = {
  email: string;
  fullName: string;
  metadata?: Record<string, unknown>;
  password?: string;
  phone?: string | null;
  role: ScriptRole;
  status?: ScriptProfileStatus;
};

export async function createDemoUser(
  client: SupabaseClient<Database>,
  input: CreateDemoUserInput,
) {
  const { data, error } = await client.auth.admin.createUser({
    email: input.email,
    email_confirm: true,
    password: input.password ?? DEMO_PASSWORD,
    user_metadata: {
      batch: DEMO_BATCH,
      is_demo: true,
      role: input.role,
      ...(input.metadata ?? {}),
    },
  });

  unwrapError(error, `Unable to create auth user ${input.email}`);

  if (!data.user) {
    throw new Error(`Supabase did not return a user id for ${input.email}`);
  }

  const { error: profileError } = await client.from("profiles").insert({
    email: input.email,
    full_name: input.fullName,
    id: data.user.id,
    metadata: {
      batch: DEMO_BATCH,
      ...(input.metadata ?? {}),
    },
    must_change_password: false,
    phone: input.phone ?? null,
    role_code: input.role,
    status: input.status ?? "ACTIVE",
    ...DEMO_MARKER,
  } as never);

  if (profileError) {
    await client.auth.admin.deleteUser(data.user.id);
    throw new Error(`Unable to create profile for ${input.email}: ${profileError.message}`);
  }

  return data.user.id;
}
