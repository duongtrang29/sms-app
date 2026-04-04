"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { failure, parseWithSchema } from "@/lib/actions";
import { createAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { matchServerFieldErrors } from "@/lib/form-errors";
import { createClient } from "@/lib/supabase/server";
import { courseSchema } from "@/features/courses/schemas";
import type { ActionState } from "@/types/app";

function getStringField(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : null;
}

function getReturnPath(formData: FormData) {
  const returnTo = getStringField(formData, "return_to");
  return returnTo && returnTo.startsWith("/admin/courses")
    ? returnTo
    : "/admin/courses";
}

function redirectToCourses(
  returnPath: string,
  type: "error" | "success",
  message: string,
): never {
  const url = new URL(`http://local${returnPath}`);
  url.searchParams.set(type, message);
  redirect(`${url.pathname}?${url.searchParams.toString()}`);
}

export async function upsertCourseAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);
  const returnPath = getReturnPath(formData);
  const parsed = parseWithSchema(courseSchema, formData);

  if (!parsed.success) {
    return failure("Thông tin môn học chưa hợp lệ.", parsed.errors);
  }

  const supabase = await createClient();
  const prerequisiteCodes = (parsed.data.prerequisite_codes ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  const payload = {
    code: parsed.data.code.toUpperCase(),
    credit_hours: parsed.data.credit_hours,
    department_id: parsed.data.department_id,
    description: parsed.data.description || null,
    is_active: parsed.data.status === "ACTIVE",
    name: parsed.data.name,
    total_sessions: parsed.data.total_sessions,
  };

  let courseId = parsed.data.id;

  if (parsed.data.id) {
    const { error } = await supabase
      .from("courses")
      .update(payload as never)
      .eq("id", parsed.data.id);

    if (error) {
      const fieldErrors = matchServerFieldErrors(error.message, [
        {
          field: "code",
          message: "Mã môn đã tồn tại.",
          test: ["courses_code_key", "duplicate key"],
        },
      ]);

      return failure(
        fieldErrors?.code?.[0] ?? "Không thể cập nhật môn học.",
        fieldErrors,
      );
    }
  } else {
    const { data, error } = await supabase
      .from("courses")
      .insert(payload as never)
      .select("id")
      .single();

    if (error) {
      const fieldErrors = matchServerFieldErrors(error.message, [
        {
          field: "code",
          message: "Mã môn đã tồn tại.",
          test: ["courses_code_key", "duplicate key"],
        },
      ]);

      return failure(
        fieldErrors?.code?.[0] ?? "Không thể tạo môn học.",
        fieldErrors,
      );
    }

    courseId = (data as { id: string }).id;
  }

  if (!courseId) {
    return failure("Không thể xác định môn học để lưu tiên quyết.");
  }

  const { error: deleteError } = await supabase
    .from("course_prerequisites")
    .delete()
    .eq("course_id", courseId);

  if (deleteError) {
    return failure("Không thể cập nhật môn tiên quyết.");
  }

  if (prerequisiteCodes.length) {
    const { data: prerequisiteCourses, error: prerequisiteLookupError } =
      await supabase
        .from("courses")
        .select("id, code")
        .in("code", prerequisiteCodes as never);

    if (prerequisiteLookupError) {
      return failure("Không thể kiểm tra môn tiên quyết.");
    }

    const foundCodes = new Set(
      ((prerequisiteCourses as Array<{ code: string; id: string }>) ?? []).map(
        (course) => course.code,
      ),
    );
    const missingCodes = prerequisiteCodes.filter((code) => !foundCodes.has(code));

    if (missingCodes.length) {
      return failure(
        `Không tìm thấy môn tiên quyết: ${missingCodes.join(", ")}`,
        {
          prerequisite_codes: [
            `Không tìm thấy môn tiên quyết: ${missingCodes.join(", ")}`,
          ],
        },
      );
    }

    const prerequisitePayload = (
      prerequisiteCourses as Array<{ id: string }>
    ).map((course) => ({
      course_id: courseId,
      minimum_score: 5,
      prerequisite_course_id: course.id,
    }));

    const { error: insertPrerequisiteError } = await supabase
      .from("course_prerequisites")
      .insert(prerequisitePayload as never);

    if (insertPrerequisiteError) {
      return failure("Không thể lưu môn tiên quyết.", {
        prerequisite_codes: ["Không thể lưu môn tiên quyết."],
      });
    }
  }

  await createAuditLog({
    action: parsed.data.id ? "COURSE_UPDATED" : "COURSE_CREATED",
    entityId: courseId,
    entityType: "courses",
  });

  revalidatePath("/admin/courses");
  revalidatePath("/admin/offerings");
  redirectToCourses(
    returnPath,
    "success",
    parsed.data.id ? "Đã cập nhật môn học." : "Đã tạo môn học mới.",
  );
}

export async function deleteCourseFormAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const returnPath = getReturnPath(formData);
  const courseId = getStringField(formData, "course_id");

  if (!courseId) {
    redirectToCourses(returnPath, "error", "Thiếu môn học cần xóa.");
  }

  const supabase = await createClient();

  const [
    { count: offeringCount, error: offeringError },
    { count: prerequisiteReferenceCount, error: prerequisiteReferenceError },
  ] = await Promise.all([
    supabase
      .from("course_offerings")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId),
    supabase
      .from("course_prerequisites")
      .select("course_id", { count: "exact", head: true })
      .eq("prerequisite_course_id", courseId),
  ]);

  if (offeringError || prerequisiteReferenceError) {
    redirectToCourses(
      returnPath,
      "error",
      offeringError?.message ??
        prerequisiteReferenceError?.message ??
        "Không thể kiểm tra ràng buộc môn học.",
    );
  }

  if ((offeringCount ?? 0) > 0) {
    redirectToCourses(
      returnPath,
      "error",
      "Môn học đã có học phần mở, không thể xóa.",
    );
  }

  if ((prerequisiteReferenceCount ?? 0) > 0) {
    redirectToCourses(
      returnPath,
      "error",
      "Môn học đang được dùng làm môn tiên quyết, không thể xóa.",
    );
  }

  const { error: deleteError } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId);

  if (deleteError) {
    redirectToCourses(returnPath, "error", deleteError.message);
  }

  await createAuditLog({
    action: "COURSE_DELETED",
    entityId: courseId,
    entityType: "courses",
  });

  revalidatePath("/admin/courses");
  revalidatePath("/admin/offerings");
  redirectToCourses(returnPath, "success", "Đã xóa môn học.");
}
