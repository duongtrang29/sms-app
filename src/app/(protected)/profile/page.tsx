import {
  KeyRoundIcon,
  MailIcon,
  PencilLineIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ProfileUpdateForm } from "@/components/profile/profile-update-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { requireAuth } from "@/lib/auth/session";
import { roleLabel } from "@/lib/auth/roles";

export default async function ProfilePage() {
  const profile = await requireAuth();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Tài khoản hiện tại & bảo mật cơ bản."
        icon={<UserRoundIcon className="size-5" />}
        info="Thông tin hồ sơ và thao tác bảo mật cơ bản của tài khoản hiện tại."
        title="Hồ sơ cá nhân"
      />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionPanel
          description="Thông tin hồ sơ đang dùng để đăng nhập và phân quyền."
          title="Thông tin tài khoản"
        >
          <div className="grid gap-4">
            <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="app-subtle-surface p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
                  <UserRoundIcon className="size-3.5" />
                  Họ tên
                </div>
                <div className="mt-2 text-base font-medium text-foreground">{profile.full_name}</div>
              </div>
              <div className="app-subtle-surface p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
                  <MailIcon className="size-3.5" />
                  Email
                </div>
                <div className="mt-2 text-base font-medium text-foreground">{profile.email}</div>
              </div>
              <div className="app-subtle-surface p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
                  <ShieldCheckIcon className="size-3.5" />
                  Vai trò
                </div>
                <div className="mt-2 text-base font-medium text-foreground">
                  {roleLabel(profile.role_code)}
                </div>
              </div>
              <div className="app-subtle-surface p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
                  <PhoneIcon className="size-3.5" />
                  Điện thoại
                </div>
                <div className="mt-2 text-base font-medium text-foreground">
                  {profile.phone ?? "Chưa cập nhật"}
                </div>
              </div>
            </div>
            <div className="app-subtle-surface p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
                <PencilLineIcon className="size-4 text-[color:var(--color-info)]" />
                Cập nhật hồ sơ cá nhân
              </div>
              <ProfileUpdateForm
                defaultFullName={profile.full_name}
                defaultPhone={profile.phone}
              />
            </div>
          </div>
        </SectionPanel>
        <SectionPanel
          description="Cập nhật mật khẩu cho phiên đăng nhập hiện tại."
          title="Bảo mật"
        >
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
            <KeyRoundIcon className="size-4 text-[color:var(--color-info)]" />
            Đổi mật khẩu
          </div>
          <div className="app-subtle-surface p-4">
            <ResetPasswordForm />
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
