import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Đăng nhập",
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const profile = await getCurrentProfile();

  if (profile?.status === "ACTIVE") {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : undefined;

  return (
    <AuthCardShell
      description="Đăng nhập bằng tài khoản do quản trị viên cấp để truy cập hệ thống quản lý sinh viên."
      title="Đăng nhập hệ thống"
    >
      <LoginForm initialMessage={error} />
      <div className="mt-6 text-sm text-muted-foreground">
        Quên mật khẩu?{" "}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:text-muted-foreground hover:underline"
          href="/forgot-password"
        >
          Đặt lại tại đây
        </Link>
      </div>
    </AuthCardShell>
  );
}
