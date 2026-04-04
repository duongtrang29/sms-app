import type { Metadata } from "next";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
};

export default function ResetPasswordPage() {
  return (
    <AuthCardShell
      description="Thiết lập mật khẩu mới để tiếp tục sử dụng hệ thống."
      title="Đặt lại mật khẩu"
    >
      <ResetPasswordForm />
    </AuthCardShell>
  );
}
