import { AppShell } from "@/components/layout/AppShell";
import { requireAuth } from "@/lib/auth/session";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireAuth();

  return <AppShell profile={profile}>{children}</AppShell>;
}
