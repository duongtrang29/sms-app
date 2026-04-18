"use server";

import { revalidatePath } from "next/cache";

import { failure, parseWithSchema, success } from "@/lib/actions";
import { createAuditLog } from "@/lib/audit";
import { parseSupabaseError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/features/profile/schemas";
import type { ActionState } from "@/types/app";

export async function updateProfileAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const parsed = parseWithSchema(updateProfileSchema, formData);

    if (!parsed.success) {
      return failure("Thông tin hồ sơ chưa hợp lệ.", parsed.errors);
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return failure(parseSupabaseError(userError, "Không thể xác thực tài khoản."));
    }

    if (!user) {
      return failure("Phiên đăng nhập đã hết hạn.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return failure(parseSupabaseError(profileError, "Không thể tải hồ sơ cá nhân."));
    }

    const typedProfile = profile as { status: string } | null;
    if (!typedProfile) {
      return failure("Không tìm thấy hồ sơ người dùng.");
    }

    if (typedProfile.status !== "ACTIVE") {
      return failure("Tài khoản không còn hiệu lực truy cập.");
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.full_name,
        phone: parsed.data.phone || null,
      } as never)
      .eq("id", user.id);

    if (updateError) {
      return failure(parseSupabaseError(updateError, "Không thể cập nhật hồ sơ cá nhân."));
    }

    await createAuditLog({
      action: "PROFILE_UPDATED",
      entityId: user.id,
      entityType: "profiles",
      targetUserId: user.id,
    });

    revalidatePath("/profile");
    return success("Đã cập nhật hồ sơ cá nhân.");
  } catch (error) {
    return failure(parseSupabaseError(error, "Không thể cập nhật hồ sơ cá nhân."));
  }
}
