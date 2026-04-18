"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

type AuditPayload = {
  action: string;
  entityId?: string | null;
  entityType: string;
  metadata?: Json;
  targetUserId?: string | null;
};

type AuditFailureReason =
  | "ACTOR_LOOKUP_FAILED"
  | "ACTOR_NOT_AUTHENTICATED"
  | "AUDIT_RPC_FAILED";

type AuditFailure = {
  message: string;
  reason: AuditFailureReason;
  status: "failed";
};

type AuditSuccess = {
  logId: number | null;
  status: "success";
};

export type AuditLogResult = AuditFailure | AuditSuccess;

function failure(reason: AuditFailureReason, message: string): AuditFailure {
  return {
    message,
    reason,
    status: "failed",
  };
}

async function resolveAuditActorId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return failure(
      "ACTOR_LOOKUP_FAILED",
      `Không thể xác thực người thao tác khi ghi audit: ${error.message}`,
    );
  }

  if (!user?.id) {
    return failure(
      "ACTOR_NOT_AUTHENTICATED",
      "Không thể ghi audit do phiên đăng nhập không hợp lệ.",
    );
  }

  return {
    status: "success" as const,
    userId: user.id,
  };
}

export async function tryCreateAuditLog(
  payload: AuditPayload,
): Promise<AuditLogResult> {
  const actor = await resolveAuditActorId();
  if (actor.status !== "success") {
    return actor;
  }

  const admin = createAdminClient();
  const safeMetadata =
    payload.metadata &&
    typeof payload.metadata === "object" &&
    !Array.isArray(payload.metadata)
      ? payload.metadata
      : {};
  const metadata = {
    ...safeMetadata,
    __actor_id: actor.userId,
  } as Json;
  const args = {
    p_action: payload.action,
    p_entity_id: payload.entityId ?? null,
    p_entity_type: payload.entityType,
    p_metadata: metadata,
    p_target_user_id: payload.targetUserId ?? null,
  };
  const rpc = admin.rpc.bind(admin) as unknown as (
    fn: "log_audit_event",
    rpcPayload: typeof args,
  ) => Promise<{ data: number | null; error: { message: string } | null }>;
  const { data, error } = await rpc("log_audit_event", args);

  if (error) {
    return failure(
      "AUDIT_RPC_FAILED",
      `Không thể ghi audit log: ${error.message}`,
    );
  }

  return {
    logId: data ?? null,
    status: "success",
  };
}

export async function createAuditLog(payload: AuditPayload): Promise<number | null> {
  const result = await tryCreateAuditLog(payload);

  if (result.status !== "success") {
    throw new Error(result.message);
  }

  return result.logId;
}
