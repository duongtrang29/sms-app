"use server";

import { redirect } from "next/navigation";

import { failure, parseWithSchema, success } from "@/lib/actions";
import { matchServerFieldErrors } from "@/lib/form-errors";
import { isAppRole } from "@/lib/auth/roles";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/features/auth/schemas";
import type { ActionState } from "@/types/app";
import type { Json } from "@/types/database";

async function tryAuditLog(
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
) {
  const supabase = await createClient();
  const args = {
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId ?? null,
    p_target_user_id: null,
    p_metadata: (metadata ?? {}) as Json,
  };

  try {
    const rpc = supabase.rpc.bind(supabase) as unknown as (
      fn: "log_audit_event",
      payload: typeof args,
    ) => Promise<{ error: { message: string } | null }>;
    const { error } = await rpc("log_audit_event", args);

    if (error) {
      console.error("Failed to write auth audit log:", error.message, args);
    }
  } catch (error) {
    console.error("Unexpected auth audit log failure:", error, args);
  }
}

export async function loginAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseWithSchema(loginSchema, formData);

  if (!parsed.success) {
    return failure("Dữ liệu đăng nhập chưa hợp lệ.", parsed.errors);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    const fieldErrors = matchServerFieldErrors(error.message, [
      {
        field: "email",
        message: "Email hoặc mật khẩu không chính xác.",
        test: ["invalid login credentials", "invalid credentials"],
      },
      {
        field: "password",
        message: "Email hoặc mật khẩu không chính xác.",
        test: ["invalid login credentials", "invalid credentials"],
      },
    ]);

    return failure(
      "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.",
      fieldErrors,
    );
  }

  const userId = data.user?.id;

  if (!userId) {
    await supabase.auth.signOut();
    return failure("Không thể xác định hồ sơ đăng nhập.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role_code, status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    await supabase.auth.signOut();
    return failure("Không thể kiểm tra quyền truy cập của tài khoản.");
  }

  const normalizedProfile = profile as
    | { role_code: string; status: string }
    | null;

  if (
    !normalizedProfile ||
    !isAppRole(normalizedProfile.role_code) ||
    normalizedProfile.status !== "ACTIVE"
  ) {
    await supabase.auth.signOut();
    return failure("Tài khoản không có quyền truy cập hoặc đang bị khóa.");
  }

  await tryAuditLog("AUTH_LOGIN", "auth");
  redirect("/dashboard");
}

export async function forgotPasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseWithSchema(forgotPasswordSchema, formData);

  if (!parsed.success) {
    return failure("Email chưa hợp lệ.", parsed.errors);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  });

  if (error) {
    const fieldErrors = matchServerFieldErrors(error.message, [
      {
        field: "email",
        message: "Không thể gửi email đặt lại mật khẩu cho địa chỉ này.",
        test: "email",
      },
    ]);

    return failure("Không thể gửi email đặt lại mật khẩu.", fieldErrors);
  }

  return success("Đã gửi email hướng dẫn đặt lại mật khẩu.");
}

export async function resetPasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseWithSchema(resetPasswordSchema, formData);

  if (!parsed.success) {
    return failure("Mật khẩu mới chưa hợp lệ.", parsed.errors);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    const fieldErrors = matchServerFieldErrors(error.message, [
      {
        field: "password",
        message: "Không thể cập nhật mật khẩu mới.",
        test: "password",
      },
    ]);

    return failure("Không thể cập nhật mật khẩu.", fieldErrors);
  }

  await tryAuditLog("PASSWORD_RESET", "auth");
  return success("Mật khẩu đã được cập nhật.");
}

export async function changePasswordAction(
  previousState: ActionState,
  formData: FormData,
) {
  return resetPasswordAction(previousState, formData);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
