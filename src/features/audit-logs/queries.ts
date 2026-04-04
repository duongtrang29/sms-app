import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type { AuditLog } from "@/types/app";

export type AuditLogFilters = {
  action?: string;
  demo?: "all" | "demo" | "live";
  limit?: number;
  query?: string;
  role?: string;
};

export type AuditLogListItem = AuditLog & {
  actor_email: string | null;
  actor_name: string | null;
  target_email: string | null;
  target_name: string | null;
};

export type AuditLogSnapshot = {
  availableActions: string[];
  availableRoles: string[];
  items: AuditLogListItem[];
  summary: {
    authEvents: number;
    demoEvents: number;
    liveEvents: number;
    totalEvents: number;
    todayEvents: number;
  };
};

export async function listAuditLogs(filters: AuditLogFilters = {}) {
  await requireRole(["ADMIN"]);
  const supabase = await createClient();
  const limit = filters.limit ?? 200;

  let logsQuery = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.action) {
    logsQuery = logsQuery.eq("action", filters.action);
  }

  if (filters.role) {
    logsQuery = logsQuery.eq("actor_role", filters.role);
  }

  if (filters.demo === "demo") {
    logsQuery = logsQuery.eq("is_demo", true);
  }

  if (filters.demo === "live") {
    logsQuery = logsQuery.eq("is_demo", false);
  }

  const [
    { data: logsData, error: logsError },
    { count: totalEventsCount, error: totalEventsError },
    { count: demoEventsCount, error: demoEventsError },
    { count: liveEventsCount, error: liveEventsError },
    { count: authEventsCount, error: authEventsError },
  ] = await Promise.all([
    logsQuery,
    supabase.from("audit_logs").select("*", { count: "exact", head: true }),
    supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("is_demo", true),
    supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("is_demo", false),
    supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .ilike("action", "AUTH_%"),
  ]);

  const errors = [
    logsError,
    totalEventsError,
    demoEventsError,
    liveEventsError,
    authEventsError,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors[0]?.message ?? "Không thể tải nhật ký hệ thống.");
  }

  const allLogs = (logsData ?? []) as AuditLog[];
  const normalizedQuery = filters.query?.trim().toLowerCase();
  const filteredLogs = normalizedQuery
    ? allLogs.filter((item) =>
        [
          item.action,
          item.actor_role,
          item.entity_type,
          item.entity_id,
          JSON.stringify(item.metadata),
        ]
          .filter(Boolean)
          .some((field) => field?.toLowerCase().includes(normalizedQuery)),
      )
    : allLogs;

  const userIds = [
    ...new Set(
      filteredLogs.flatMap((item) =>
        [item.actor_id, item.target_user_id].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    ),
  ];

  const { data: profilesData, error: profilesError } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds as never)
    : { data: [], error: null };

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profileMap = new Map(
    (
      (profilesData as Array<{ email: string; full_name: string; id: string }>) ??
      []
    ).map((profile) => [profile.id, profile]),
  );

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return {
    availableActions: [
      ...new Set(
        allLogs
          .map((item) => item.action)
          .filter((item): item is string => Boolean(item)),
      ),
    ].sort(),
    availableRoles: [
      ...new Set(
        allLogs
          .map((item) => item.actor_role)
          .filter((item): item is string => Boolean(item)),
      ),
    ].sort(),
    items: filteredLogs.map((item) => ({
      ...item,
      actor_email: item.actor_id ? (profileMap.get(item.actor_id)?.email ?? null) : null,
      actor_name: item.actor_id ? (profileMap.get(item.actor_id)?.full_name ?? null) : null,
      target_email: item.target_user_id
        ? (profileMap.get(item.target_user_id)?.email ?? null)
        : null,
      target_name: item.target_user_id
        ? (profileMap.get(item.target_user_id)?.full_name ?? null)
        : null,
    })),
    summary: {
      authEvents: authEventsCount ?? 0,
      demoEvents: demoEventsCount ?? 0,
      liveEvents: liveEventsCount ?? 0,
      todayEvents: filteredLogs.filter(
        (item) => new Date(item.created_at) >= startOfToday,
      ).length,
      totalEvents: totalEventsCount ?? 0,
    },
  } satisfies AuditLogSnapshot;
}
