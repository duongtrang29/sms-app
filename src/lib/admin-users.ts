"use server";

import { tryCreateAuditLog } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole, ProfileStatus } from "@/types/app";

type CreateManagedUserInput = {
  demoBatch?: string | null;
  email: string;
  fullName: string;
  isDemo?: boolean;
  metadata?: Record<string, unknown>;
  mustChangePassword?: boolean;
  password: string;
  phone?: string | null;
  role: AppRole;
  status: ProfileStatus;
};

type UpdateManagedUserInput = {
  fullName: string;
  metadata?: Record<string, unknown>;
  mustChangePassword?: boolean;
  password?: string;
  phone?: string | null;
  status: ProfileStatus;
  userId: string;
};

type StepStatus = "failed" | "skipped" | "success";

export type ManagedUserCreateResult = {
  status: "partial" | "success";
  userId: string;
  warning?: string;
};

export type ManagedUserUpdateResult = {
  auditStep: StepStatus;
  authStep: StepStatus;
  message?: string;
  profileStep: StepStatus;
  status: "failed" | "partial" | "success";
};

export async function createManagedUser(
  input: CreateManagedUserInput,
): Promise<ManagedUserCreateResult> {
  const admin = createAdminClient();
  const authPayload = {
    email: input.email,
    email_confirm: true,
    password: input.password,
    user_metadata: {
      role: input.role,
      ...input.metadata,
    },
    ...(input.phone ? { phone: input.phone } : {}),
  };
  const { data, error } = await admin.auth.admin.createUser(authPayload);

  if (error || !data.user) {
    throw new Error(error?.message ?? "Unable to create auth user.");
  }

  const profilePayload = {
    demo_batch: input.demoBatch ?? null,
    email: input.email,
    full_name: input.fullName,
    id: data.user.id,
    is_demo: input.isDemo ?? false,
    metadata: input.metadata ?? {},
    must_change_password: input.mustChangePassword ?? true,
    phone: input.phone ?? null,
    role_code: input.role,
    status: input.status,
  };

  const { error: profileError } = await admin
    .from("profiles")
    .insert(profilePayload as never);

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error(profileError.message);
  }

  const auditResult = await tryCreateAuditLog({
    action: "USER_PROVISIONED",
    entityId: data.user.id,
    entityType: "profiles",
    metadata: {
      email: input.email,
      role: input.role,
    },
    targetUserId: data.user.id,
  });

  if (auditResult.status !== "success") {
    return {
      status: "partial",
      userId: data.user.id,
      warning:
        "Đã tạo tài khoản và hồ sơ nhưng không ghi được audit log. Vui lòng kiểm tra nhật ký hệ thống.",
    };
  }

  return {
    status: "success",
    userId: data.user.id,
  };
}

export async function updateManagedUser(
  input: UpdateManagedUserInput,
): Promise<ManagedUserUpdateResult> {
  const admin = createAdminClient();
  const profilePayload: Record<string, unknown> = {
    full_name: input.fullName,
    phone: input.phone ?? null,
    status: input.status,
  };

  if (input.metadata !== undefined) {
    profilePayload.metadata = input.metadata;
  }

  if (input.mustChangePassword !== undefined) {
    profilePayload.must_change_password = input.mustChangePassword;
  }

  let authStep: StepStatus = "skipped";

  if (input.password) {
    const { error: authError } = await admin.auth.admin.updateUserById(
      input.userId,
      {
        password: input.password,
      },
    );

    if (authError) {
      return {
        auditStep: "skipped",
        authStep: "failed",
        message: `Không thể cập nhật mật khẩu người dùng: ${authError.message}`,
        profileStep: "skipped",
        status: "failed",
      };
    }

    authStep = "success";
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update(profilePayload as never)
    .eq("id", input.userId);

  if (profileError) {
    if (authStep === "success") {
      return {
        auditStep: "skipped",
        authStep,
        message:
          `Đã cập nhật mật khẩu nhưng không cập nhật được hồ sơ: ${profileError.message}. ` +
          "Vui lòng đồng bộ lại hồ sơ người dùng.",
        profileStep: "failed",
        status: "partial",
      };
    }

    return {
      auditStep: "skipped",
      authStep,
      message: profileError.message,
      profileStep: "failed",
      status: "failed",
    };
  }

  const auditResult = await tryCreateAuditLog({
    action: "USER_UPDATED",
    entityId: input.userId,
    entityType: "profiles",
    targetUserId: input.userId,
  });

  if (auditResult.status !== "success") {
    return {
      auditStep: "failed",
      authStep,
      message:
        "Đã cập nhật thông tin người dùng nhưng không ghi được audit log. Vui lòng kiểm tra nhật ký hệ thống.",
      profileStep: "success",
      status: "partial",
    };
  }

  return {
    auditStep: "success",
    authStep,
    profileStep: "success",
    status: "success",
  };
}

export async function deleteManagedUser(userId: string) {
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error && !error.message.includes("User not found")) {
    throw new Error(error.message);
  }
}
