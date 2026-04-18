"use server";

import { redirect } from "next/navigation";

import { failure, parseWithSchema, partial, success } from "@/lib/actions";
import { tryCreateAuditLog } from "@/lib/audit";
import { matchServerFieldErrors } from "@/lib/form-errors";
import { isAppRole } from "@/lib/auth/roles";
import { parseSupabaseError } from "@/lib/errors";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/features/auth/schemas";
import type { ActionState } from "@/types/app";

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
      parseSupabaseError(
        error,
        "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.",
      ),
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

  const auditResult = await tryCreateAuditLog({
    action: "AUTH_LOGIN",
    entityType: "auth",
  });

  if (auditResult.status !== "success") {
    console.error(
      `[AUTH_LOGIN_AUDIT_FAILED] ${auditResult.reason}: ${auditResult.message}`,
    );
  }

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

    return failure(
      parseSupabaseError(error, "Không thể gửi email đặt lại mật khẩu."),
      fieldErrors,
    );
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

    return failure(
      parseSupabaseError(error, "Không thể cập nhật mật khẩu."),
      fieldErrors,
    );
  }

  const auditResult = await tryCreateAuditLog({
    action: "PASSWORD_RESET",
    entityType: "auth",
  });

  if (auditResult.status !== "success") {
    return partial(
      "Mật khẩu đã cập nhật nhưng hệ thống không ghi được nhật ký bảo mật. Vui lòng liên hệ quản trị viên.",
    );
  }

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
