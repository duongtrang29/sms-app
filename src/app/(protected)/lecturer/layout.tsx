import { requireRole } from "@/lib/auth/session";

export default async function LecturerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole(["LECTURER"]);
  return children;
}
