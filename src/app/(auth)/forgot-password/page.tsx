import type { Metadata } from "next";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Quên mật khẩu",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCardShell
      description="Nhập email tài khoản đã được cấp để nhận liên kết đặt lại mật khẩu."
      title="Quên mật khẩu"
    >
      <ForgotPasswordForm />
    </AuthCardShell>
  );
}
