"use server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

type AuditPayload = {
  action: string;
  entityId?: string | null;
  entityType: string;
  metadata?: Json;
  targetUserId?: string | null;
};

export async function createAuditLog(payload: AuditPayload) {
  const supabase = await createClient();
  const args = {
    p_action: payload.action,
    p_entity_type: payload.entityType,
    p_entity_id: payload.entityId ?? null,
    p_target_user_id: payload.targetUserId ?? null,
    p_metadata: payload.metadata ?? {},
  };

  try {
    const rpc = supabase.rpc.bind(supabase) as unknown as (
      fn: "log_audit_event",
      rpcPayload: typeof args,
    ) => Promise<{ error: { message: string } | null }>;
    const { error } = await rpc("log_audit_event", args);

    if (error) {
      console.error("Failed to write audit log:", error.message, payload);
    }
  } catch (error) {
    console.error("Unexpected audit log failure:", error, payload);
  }
}
