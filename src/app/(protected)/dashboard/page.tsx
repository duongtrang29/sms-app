import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/session";

export default async function DashboardRedirectPage() {
  const profile = await requireAuth();
  redirect(`/${profile.role_code.toLowerCase()}`);
}
