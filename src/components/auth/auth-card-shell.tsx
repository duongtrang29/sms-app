import { siteConfig } from "@/lib/constants/site";

type AuthCardShellProps = {
  children: React.ReactNode;
  description: string;
  title: string;
};

export function AuthCardShell({
  children,
  description,
  title,
}: AuthCardShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-dropdown)] lg:grid-cols-2">
        <div className="hidden border-r border-border bg-blue-50 p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {siteConfig.shortName}
            </p>
            <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-tight text-foreground">
              Hệ thống quản lý sinh viên
            </h2>
            <p className="mt-3 max-w-lg text-sm text-muted-foreground">
              Giao diện mới tập trung vào thao tác nhanh, dữ liệu rõ ràng và vận hành ổn định.
            </p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white p-5 text-sm text-muted-foreground">
            Dữ liệu, phân quyền và quy trình xử lý nghiệp vụ vẫn giữ nguyên theo hệ thống hiện tại.
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-md">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {siteConfig.shortName}
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
