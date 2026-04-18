import { AppShell as NewAppShell } from "@/components/layout/AppShell";
import type { AuthenticatedProfile } from "@/types/app";

type AppShellProps = {
  children: React.ReactNode;
  profile: AuthenticatedProfile;
};

export function AppShell({ children, profile }: AppShellProps) {
  return <NewAppShell profile={profile}>{children}</NewAppShell>;
}
