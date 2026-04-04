import { CompactDescription } from "@/components/shared/compact-description";
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
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="app-surface grid w-full max-w-6xl overflow-hidden xl:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden border-r border-border/70 xl:flex xl:flex-col xl:justify-between xl:bg-[linear-gradient(180deg,rgba(246,248,251,0.82),rgba(236,240,245,0.92))] xl:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(83,112,164,0.14),transparent_34%),linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:auto,28px_28px,28px_28px]" />
          <div className="relative space-y-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              {siteConfig.shortName}
            </div>
            <div className="max-w-xl space-y-4">
              <h2 className="text-4xl font-semibold tracking-[-0.04em] text-foreground">
                Không gian học vụ gọn, rõ và sẵn sàng cho vận hành thật.
              </h2>
              <CompactDescription
                className="max-w-lg text-sm text-muted-foreground"
                maxLength={70}
                text="Theo dõi học phần, lớp, bảng điểm và quyền truy cập trong cùng một trải nghiệm nhất quán, ưu tiên độ rõ ràng và tốc độ thao tác."
              />
            </div>
          </div>
          <div className="relative grid gap-4 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-5">
              <CompactDescription
                maxLength={54}
                text="Phân quyền phía máy chủ, dữ liệu học vụ và luồng điểm được giữ nguyên."
              />
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-5">
              <CompactDescription
                maxLength={54}
                text="Giao diện tối giản hơn để tập trung vào bảng dữ liệu, form và trạng thái hệ thống."
              />
            </div>
          </div>
        </div>
        <div className="relative px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex flex-col gap-3">
              <span className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
                {siteConfig.shortName}
              </span>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
                {title}
              </h1>
              <CompactDescription
                className="text-sm text-muted-foreground"
                maxLength={72}
                text={description}
              />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
