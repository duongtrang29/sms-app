import Link from "next/link";
import {
  ArrowRightIcon,
  BarChart3Icon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  UserRoundIcon,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { getAdminReportSnapshot } from "@/features/reports/queries";

const quickLinks = [
  {
    description: "Tạo & lọc hồ sơ sinh viên",
    href: "/admin/students",
    icon: GraduationCapIcon,
    label: "Sinh viên",
  },
  {
    description: "Quản lý giảng viên & tài khoản",
    href: "/admin/lecturers",
    icon: UserRoundIcon,
    label: "Giảng viên",
  },
  {
    description: "Mở học phần & gán giảng viên",
    href: "/admin/offerings",
    icon: ClipboardListIcon,
    label: "Học phần mở",
  },
  {
    description: "Duyệt, khóa & mở khóa điểm",
    href: "/admin/grades",
    icon: ClipboardCheckIcon,
    label: "Duyệt điểm",
  },
  {
    description: "Cảnh báo học vụ & thống kê",
    href: "/admin/reports",
    icon: BarChart3Icon,
    label: "Báo cáo",
  },
] as const;

export default async function AdminHomePage() {
  const report = await getAdminReportSnapshot();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Bức tranh điều hành cho toàn bộ admin."
        icon={<LayoutDashboardIcon className="size-5" />}
        info="Tổng quan quản trị nhanh để điều phối danh mục gốc, học phần, lịch học, điểm số và nhật ký hệ thống."
        title="Dashboard"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Sinh viên còn hiệu lực học tập"
          icon={<GraduationCapIcon className="size-4" />}
          label="Sinh viên"
          tone="primary"
          value={report.summary.activeStudents}
        />
        <StatCard
          description="Giảng viên đã được cấp hồ sơ"
          icon={<UserRoundIcon className="size-4" />}
          label="Giảng viên"
          tone="info"
          value={report.summary.totalLecturers}
        />
        <StatCard
          description="Học phần còn đang mở đăng ký"
          icon={<ClipboardListIcon className="size-4" />}
          label="Học phần đang mở"
          tone="success"
          value={report.summary.openOfferings}
        />
        <StatCard
          description="Yêu cầu phúc khảo đang chờ xử lý"
          icon={<ClipboardCheckIcon className="size-4" />}
          label="Phúc khảo"
          tone="warning"
          value={report.summary.pendingRegrades}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionPanel
          description="Lối tắt cho các phân hệ thao tác thường xuyên."
          title="Đi nhanh"
        >
          <div className="grid gap-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.href}
                  className="app-subtle-surface flex items-center justify-between gap-4 p-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-background/90 text-[color:var(--color-info-foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold tracking-tight">{item.label}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <Link href={item.href}>
                    <Button variant="outline">
                      Vào nhanh
                      <ArrowRightIcon data-icon="inline-end" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </SectionPanel>
        <SectionPanel
          description="Điểm cần theo dõi trong ngày."
          title="Điểm nhấn vận hành"
        >
          <div className="grid gap-3">
            <div className="app-subtle-surface p-4">
              <div className="text-sm font-semibold text-foreground">
                Điểm chờ duyệt
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                {report.summary.submittedGrades}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                  Bảng điểm đã được giảng viên gửi duyệt và đang chờ quản trị viên xác nhận.
              </div>
            </div>
            <div className="app-subtle-surface p-4">
              <div className="text-sm font-semibold text-foreground">
                Cảnh báo học vụ
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                {report.summary.activeWarnings}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Số sinh viên hiện nằm trong vùng cảnh báo học vụ theo báo cáo tổng hợp.
              </div>
            </div>
            <div className="app-subtle-surface p-4">
              <div className="text-sm font-semibold text-foreground">
                Hồ sơ minh họa / dữ liệu thật
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                {report.summary.demoRows} / {report.summary.liveRows}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                  Giúp bạn theo dõi rõ nhóm dữ liệu minh họa và dữ liệu thật đang cùng tồn tại thế nào.
              </div>
            </div>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
