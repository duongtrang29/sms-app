import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { roleLabel } from "@/lib/auth/roles";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ProfilePage() {
  const profile = await requireAuth();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Thông tin hồ sơ và thao tác bảo mật cơ bản của tài khoản hiện tại."
        title="Hồ sơ cá nhân"
      />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Thông tin tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide">Họ tên</div>
              <div className="mt-1 text-base font-medium text-foreground">{profile.full_name}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide">Email</div>
              <div className="mt-1 text-base font-medium text-foreground">{profile.email}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide">Vai trò</div>
              <div className="mt-1 text-base font-medium text-foreground">
                {roleLabel(profile.role_code)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide">Điện thoại</div>
              <div className="mt-1 text-base font-medium text-foreground">
                {profile.phone ?? "Chưa cập nhật"}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Đổi mật khẩu</CardTitle>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
