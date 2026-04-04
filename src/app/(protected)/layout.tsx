import { AppShell } from "@/components/app-shell/app-shell";
import { requireAuth } from "@/lib/auth/session";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireAuth();

  return <AppShell profile={profile}>{children}</AppShell>;
}
