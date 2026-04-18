"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { failure, parseWithSchema } from "@/lib/actions";
import {
  buildPathWithUpdates,
  getSafeReturnPath,
  getStringField,
} from "@/lib/admin-routing";
import { tryCreateAuditLog } from "@/lib/audit";
import {
  createManagedUser,
  deleteManagedUser,
  updateManagedUser,
} from "@/lib/admin-users";
import { requireRole } from "@/lib/auth/session";
import { parseSupabaseError } from "@/lib/errors";
import { matchServerFieldErrors } from "@/lib/form-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { lecturerSchema } from "@/features/lecturers/schemas";
import type { ActionState } from "@/types/app";

function redirectToLecturers(
  returnPath: string,
  type: "error" | "success",
  message: string,
): never {
  redirect(buildPathWithUpdates(returnPath, [[type, message]]));
}

export async function upsertLecturerAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);
  const returnPath = getSafeReturnPath(
    formData,
    "/admin/lecturers",
    "/admin/lecturers",
  );

  const parsed = parseWithSchema(lecturerSchema, formData);

  if (!parsed.success) {
    return failure("Thông tin giảng viên chưa hợp lệ.", parsed.errors);
  }

  const admin = createAdminClient();
  let warningMessage: string | null = null;

  try {
    const lecturerPayload = {
      academic_title: parsed.data.academic_title || null,
      department_id: parsed.data.department_id,
      employee_code: parsed.data.employee_code.toUpperCase(),
      hire_date: parsed.data.hire_date || null,
      office_location: parsed.data.office_location || null,
    };

    if (parsed.data.id) {
      const updatePayload = {
        fullName: parsed.data.full_name,
        phone: parsed.data.phone || null,
        status: parsed.data.status,
        userId: parsed.data.id,
        ...(parsed.data.password ? { password: parsed.data.password } : {}),
      };

      const managedUpdateResult = await updateManagedUser(updatePayload);

      if (
        managedUpdateResult.status === "failed" ||
        managedUpdateResult.profileStep !== "success"
      ) {
        return failure(
          managedUpdateResult.message ?? "Không thể cập nhật tài khoản giảng viên.",
        );
      }

      if (managedUpdateResult.status === "partial") {
        warningMessage = managedUpdateResult.message ?? warningMessage;
      }

      const { error } = await admin
        .from("lecturers")
        .update(lecturerPayload as never)
        .eq("id", parsed.data.id);

      if (error) {
        const fieldErrors = matchServerFieldErrors(error.message, [
          {
            field: "employee_code",
            message: "Mã giảng viên đã tồn tại.",
            test: ["lecturers_employee_code_key", "duplicate key"],
          },
        ]);

        return failure(
          fieldErrors?.employee_code?.[0] ??
            parseSupabaseError(error, "Không thể cập nhật giảng viên."),
          fieldErrors,
        );
      }

      const auditResult = await tryCreateAuditLog({
        action: "LECTURER_UPDATED",
        entityId: parsed.data.id,
        entityType: "lecturers",
        targetUserId: parsed.data.id,
      });

      if (auditResult.status !== "success") {
        warningMessage =
          "Đã cập nhật dữ liệu giảng viên nhưng không ghi được audit log.";
      }
    } else {
      if (!parsed.data.password) {
        return failure("Mật khẩu khởi tạo là bắt buộc khi tạo giảng viên.");
      }

      const managedCreateResult = await createManagedUser({
        email: parsed.data.email,
        fullName: parsed.data.full_name,
        password: parsed.data.password,
        phone: parsed.data.phone || null,
        role: "LECTURER",
        status: parsed.data.status,
      });
      const userId = managedCreateResult.userId;

      if (managedCreateResult.status === "partial") {
        warningMessage = managedCreateResult.warning ?? warningMessage;
      }

      const { error } = await admin.from("lecturers").insert({
        ...lecturerPayload,
        id: userId,
      } as never);

      if (error) {
        await deleteManagedUser(userId);
        const fieldErrors = matchServerFieldErrors(error.message, [
          {
            field: "employee_code",
            message: "Mã giảng viên đã tồn tại.",
            test: ["lecturers_employee_code_key", "duplicate key"],
          },
        ]);

        return failure(
          fieldErrors?.employee_code?.[0] ??
            parseSupabaseError(error, "Không thể tạo hồ sơ giảng viên."),
          fieldErrors,
        );
      }

      const auditResult = await tryCreateAuditLog({
        action: "LECTURER_CREATED",
        entityId: userId,
        entityType: "lecturers",
        targetUserId: userId,
      });

      if (auditResult.status !== "success") {
        warningMessage =
          "Đã tạo hồ sơ giảng viên nhưng không ghi được audit log.";
      }
    }
  } catch (error) {
    const rawMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "";
    const message = parseSupabaseError(rawMessage, "Không thể xử lý giảng viên.");
    const fieldErrors = matchServerFieldErrors(rawMessage, [
      {
        field: "email",
        message: "Email này đã được sử dụng.",
        test: ["email", "already been registered", "already registered"],
      },
      {
        field: "employee_code",
        message: "Mã giảng viên đã tồn tại.",
        test: ["lecturers_employee_code_key", "duplicate key"],
      },
    ]);

    return failure(
      fieldErrors
        ? Object.values(fieldErrors)[0]?.[0] ?? message
        : message,
      fieldErrors,
    );
  }

  revalidatePath("/admin/lecturers");
  redirectToLecturers(
    returnPath,
    "success",
    parsed.data.id
      ? warningMessage
        ? `Đã cập nhật giảng viên (cảnh báo: ${warningMessage})`
        : "Đã cập nhật giảng viên."
      : warningMessage
        ? `Đã tạo giảng viên mới (cảnh báo: ${warningMessage})`
        : "Đã tạo giảng viên mới.",
  );
}

export async function toggleLecturerStatusFormAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const returnPath = getSafeReturnPath(
    formData,
    "/admin/lecturers",
    "/admin/lecturers",
  );
  const lecturerId = getStringField(formData, "lecturer_id");
  const nextStatus = getStringField(formData, "next_status");

  if (!lecturerId || !nextStatus) {
    redirectToLecturers(
      returnPath,
      "error",
      "Thiếu dữ liệu để cập nhật trạng thái giảng viên.",
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status: nextStatus } as never)
    .eq("id", lecturerId)
    .eq("role_code", "LECTURER");

  if (error) {
    redirectToLecturers(
      returnPath,
      "error",
      parseSupabaseError(error, "Không thể cập nhật trạng thái giảng viên."),
    );
  }

  const auditResult = await tryCreateAuditLog({
    action: nextStatus === "ACTIVE" ? "LECTURER_ACTIVATED" : "LECTURER_DEACTIVATED",
    entityId: lecturerId,
    entityType: "profiles",
    metadata: {
      status: nextStatus,
    },
    targetUserId: lecturerId,
  });

  if (auditResult.status !== "success") {
    redirectToLecturers(
      returnPath,
      "error",
      "Đã cập nhật trạng thái tài khoản nhưng không ghi được audit log.",
    );
  }

  revalidatePath("/admin/lecturers");
  redirectToLecturers(
    returnPath,
    "success",
    nextStatus === "ACTIVE"
      ? "Đã kích hoạt tài khoản giảng viên."
      : "Đã tạm ngưng tài khoản giảng viên.",
  );
}
