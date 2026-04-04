import { requireRole } from "@/lib/auth/session";

export default async function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole(["STUDENT"]);
  return children;
}
