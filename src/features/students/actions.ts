"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { failure, parseWithSchema, success } from "@/lib/actions";
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
import { matchServerFieldErrors } from "@/lib/form-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { studentSchema } from "@/features/students/schemas";
import type { ActionState } from "@/types/app";

function redirectToStudents(
  returnPath: string,
  type: "error" | "success",
  message: string,
): never {
  redirect(buildPathWithUpdates(returnPath, [[type, message]]));
}

export async function upsertStudentAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);
  const returnPath = getSafeReturnPath(formData, "/admin/students", "/admin/students");

  const parsed = parseWithSchema(studentSchema, formData);

  if (!parsed.success) {
    return failure("Thông tin sinh viên chưa hợp lệ.", parsed.errors);
  }

  const admin = createAdminClient();
  let warningMessage: string | null = null;

  try {
    const studentPayload = {
      academic_class_id: parsed.data.academic_class_id,
      address: parsed.data.address || null,
      current_status: parsed.data.current_status,
      date_of_birth: parsed.data.date_of_birth || null,
      emergency_contact: parsed.data.emergency_contact || null,
      enrollment_year: parsed.data.enrollment_year,
      gender: parsed.data.gender || null,
      student_code: parsed.data.student_code.toUpperCase(),
    };

    if (parsed.data.id) {
      const managedUpdateResult = await updateManagedUser({
        fullName: parsed.data.full_name,
        phone: parsed.data.phone || null,
        status: parsed.data.access_status,
        userId: parsed.data.id,
        ...(parsed.data.password ? { password: parsed.data.password } : {}),
      });

      if (
        managedUpdateResult.status === "failed" ||
        managedUpdateResult.profileStep !== "success"
      ) {
        return failure(
          managedUpdateResult.message ?? "Không thể cập nhật tài khoản sinh viên.",
        );
      }

      if (managedUpdateResult.status === "partial") {
        warningMessage = managedUpdateResult.message ?? warningMessage;
      }

      const { error } = await admin
        .from("students")
        .update(studentPayload as never)
        .eq("id", parsed.data.id);

      if (error) {
        const fieldErrors = matchServerFieldErrors(error.message, [
          {
            field: "student_code",
            message: "MSSV đã tồn tại.",
            test: ["students_student_code_key", "duplicate key"],
          },
        ]);

        return failure(
          fieldErrors?.student_code?.[0] ?? "Không thể cập nhật sinh viên.",
          fieldErrors,
        );
      }

      const auditResult = await tryCreateAuditLog({
        action: "STUDENT_UPDATED",
        entityId: parsed.data.id,
        entityType: "students",
        targetUserId: parsed.data.id,
      });

      if (auditResult.status !== "success") {
        warningMessage =
          "Đã cập nhật dữ liệu sinh viên nhưng không ghi được audit log.";
      }
    } else {
      if (!parsed.data.password) {
        return failure("Mật khẩu khởi tạo là bắt buộc khi tạo sinh viên.");
      }

      const managedCreateResult = await createManagedUser({
        email: parsed.data.email,
        fullName: parsed.data.full_name,
        password: parsed.data.password,
        phone: parsed.data.phone || null,
        role: "STUDENT",
        status: parsed.data.access_status,
      });
      const userId = managedCreateResult.userId;

      if (managedCreateResult.status === "partial") {
        warningMessage = managedCreateResult.warning ?? warningMessage;
      }

      const { error } = await admin.from("students").insert({
        ...studentPayload,
        id: userId,
      } as never);

      if (error) {
        await deleteManagedUser(userId);
        const fieldErrors = matchServerFieldErrors(error.message, [
          {
            field: "student_code",
            message: "MSSV đã tồn tại.",
            test: ["students_student_code_key", "duplicate key"],
          },
        ]);

        return failure(
          fieldErrors?.student_code?.[0] ?? "Không thể tạo hồ sơ sinh viên.",
          fieldErrors,
        );
      }

      const auditResult = await tryCreateAuditLog({
        action: "STUDENT_CREATED",
        entityId: userId,
        entityType: "students",
        targetUserId: userId,
      });

      if (auditResult.status !== "success") {
        warningMessage =
          "Đã tạo hồ sơ sinh viên nhưng không ghi được audit log.";
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không thể xử lý sinh viên.";
    const fieldErrors = matchServerFieldErrors(message, [
      {
        field: "email",
        message: "Email này đã được sử dụng.",
        test: ["email", "already been registered", "already registered"],
      },
      {
        field: "student_code",
        message: "MSSV đã tồn tại.",
        test: ["students_student_code_key", "duplicate key"],
      },
    ]);

    return failure(
      fieldErrors
        ? Object.values(fieldErrors)[0]?.[0] ?? message
        : message,
      fieldErrors,
    );
  }

  revalidatePath("/admin/students");
  redirectToStudents(
    returnPath,
    "success",
    parsed.data.id
      ? warningMessage
        ? `Đã cập nhật sinh viên (cảnh báo: ${warningMessage})`
        : "Đã cập nhật sinh viên."
      : warningMessage
        ? `Đã tạo sinh viên mới (cảnh báo: ${warningMessage})`
        : "Đã tạo sinh viên mới.",
  );
}

type CsvStudentRow = {
  academic_class_code: string;
  address?: string;
  date_of_birth?: string;
  email: string;
  emergency_contact?: string;
  enrollment_year: string;
  full_name: string;
  gender?: string;
  password?: string;
  phone?: string;
  student_code: string;
};

export async function importStudentsAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return failure("Vui lòng chọn file CSV để nhập.", {
      file: ["Vui lòng chọn file CSV để nhập."],
    });
  }

  const content = await file.text();
  const parsed = Papa.parse<CsvStudentRow>(content, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length) {
    return failure("File CSV không hợp lệ.", {
      file: ["File CSV không đúng định dạng hoặc bị lỗi cột dữ liệu."],
    });
  }

  const admin = createAdminClient();
  const serverClient = await createClient();
  const { data: classes, error } = await serverClient
    .from("academic_classes")
    .select("id, code");

  if (error) {
    return failure("Không thể đọc danh sách lớp sinh hoạt.", {
      file: ["Không thể đọc danh sách lớp sinh hoạt để đối chiếu dữ liệu nhập."],
    });
  }

  const classMap = new Map(
    ((classes as Array<{ code: string; id: string }>) ?? []).map((item) => [
      item.code.toUpperCase(),
      item.id,
    ]),
  );

  const errors: string[] = [];

  for (const row of parsed.data) {
    try {
      const academicClassId = classMap.get(row.academic_class_code.toUpperCase());

      if (!academicClassId) {
        errors.push(`Không tìm thấy lớp ${row.academic_class_code}.`);
        continue;
      }

      const managedCreateResult = await createManagedUser({
        email: row.email,
        fullName: row.full_name,
        password: row.password || `${row.student_code}@Sms2026`,
        phone: row.phone || null,
        role: "STUDENT",
        status: "ACTIVE",
      });
      const userId = managedCreateResult.userId;

      const { error: studentError } = await admin.from("students").insert({
        academic_class_id: academicClassId,
        address: row.address || null,
        current_status: "ACTIVE",
        date_of_birth: row.date_of_birth || null,
        emergency_contact: row.emergency_contact || null,
        enrollment_year: Number(row.enrollment_year),
        gender: row.gender || null,
        id: userId,
        student_code: row.student_code.toUpperCase(),
      } as never);

      if (studentError) {
        await deleteManagedUser(userId);
        errors.push(studentError.message);
      } else if (managedCreateResult.status === "partial") {
        errors.push(
          `Sinh viên ${row.student_code} đã tạo nhưng thiếu audit log hệ thống.`,
        );
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Import lỗi.");
    }
  }

  revalidatePath("/admin/students");

  if (errors.length) {
    return failure("Import hoàn tất nhưng có dòng lỗi.", {
      file: errors,
    });
  }

  return success("Import sinh viên thành công.");
}

export async function toggleStudentStatusFormAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const returnPath = getSafeReturnPath(formData, "/admin/students", "/admin/students");
  const studentId = getStringField(formData, "student_id");
  const nextStatus = getStringField(formData, "next_status");

  if (!studentId || !nextStatus) {
    redirectToStudents(
      returnPath,
      "error",
      "Thiếu dữ liệu để cập nhật trạng thái sinh viên.",
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status: nextStatus } as never)
    .eq("id", studentId)
    .eq("role_code", "STUDENT");

  if (error) {
    redirectToStudents(returnPath, "error", error.message);
  }

  const auditResult = await tryCreateAuditLog({
    action: nextStatus === "ACTIVE" ? "STUDENT_ACTIVATED" : "STUDENT_DEACTIVATED",
    entityId: studentId,
    entityType: "profiles",
    metadata: {
      status: nextStatus,
    },
    targetUserId: studentId,
  });

  if (auditResult.status !== "success") {
    redirectToStudents(
      returnPath,
      "error",
      "Đã cập nhật trạng thái tài khoản nhưng không ghi được audit log.",
    );
  }

  revalidatePath("/admin/students");
  redirectToStudents(
    returnPath,
    "success",
    nextStatus === "ACTIVE"
      ? "Đã kích hoạt tài khoản sinh viên."
      : "Đã tạm ngưng tài khoản sinh viên.",
  );
}
