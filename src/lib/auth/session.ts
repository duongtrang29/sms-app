import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getRoleHomePath, isAppRole } from "@/lib/auth/roles";
import type { AppRole, AuthenticatedProfile } from "@/types/app";

async function fetchProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      `
        id,
        email,
        full_name,
        role_code,
        status,
        phone,
        avatar_url,
        must_change_password,
        metadata,
        is_demo,
        demo_batch,
        created_at,
        updated_at
      `,
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const typedProfile = profile as
    | (AuthenticatedProfile & { role_code: string })
    | null;

  if (!typedProfile || !isAppRole(typedProfile.role_code)) {
    return null;
  }

  return {
    ...typedProfile,
    role_code: typedProfile.role_code,
  } satisfies AuthenticatedProfile;
}

export const getCurrentProfile = cache(fetchProfile);

export const getCurrentUserId = cache(async () => {
  const profile = await getCurrentProfile();
  return profile?.id ?? null;
});

export const getCurrentUserRole = cache(async () => {
  const profile = await getCurrentProfile();
  return profile?.role_code ?? null;
});

async function signOutAndRedirectToLogin(message: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/login?error=${encodeURIComponent(message)}`);
}

export async function requireAuth() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status !== "ACTIVE") {
    await signOutAndRedirectToLogin(
      "Tài khoản không còn hiệu lực truy cập.",
    );
  }

  return profile;
}

export async function requireRole(allowedRoles: AppRole[]) {
  const profile = await requireAuth();

  if (!allowedRoles.includes(profile.role_code)) {
    redirect(getRoleHomePath(profile.role_code));
  }

  return profile;
}
