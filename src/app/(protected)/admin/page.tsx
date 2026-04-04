import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminReportSnapshot } from "@/features/reports/queries";

const quickLinks = [
  { description: "Tạo và lọc hồ sơ sinh viên", href: "/admin/students", label: "Sinh viên" },
  { description: "Quản lý giảng viên và tài khoản", href: "/admin/lecturers", label: "Giảng viên" },
  { description: "Mở học phần và gán giảng viên", href: "/admin/offerings", label: "Học phần mở" },
  { description: "Duyệt, khóa và mở khóa điểm", href: "/admin/grades", label: "Duyệt điểm" },
  { description: "Xem cảnh báo học vụ và thống kê", href: "/admin/reports", label: "Báo cáo" },
] as const;

export default async function AdminHomePage() {
  const report = await getAdminReportSnapshot();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Tổng quan quản trị nhanh để điều phối danh mục gốc, học phần, lịch học, điểm số và nhật ký hệ thống."
        eyebrow="Khu quản trị"
        title="Tổng quan quản trị"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Sinh viên còn hiệu lực học tập"
          label="Sinh viên"
          tone="primary"
          value={report.summary.activeStudents}
        />
        <StatCard
          description="Giảng viên đã được cấp hồ sơ"
          label="Giảng viên"
          tone="info"
          value={report.summary.totalLecturers}
        />
        <StatCard
          description="Học phần còn đang mở đăng ký"
          label="Học phần đang mở"
          tone="success"
          value={report.summary.openOfferings}
        />
        <StatCard
          description="Yêu cầu phúc khảo đang chờ xử lý"
          label="Phúc khảo"
          tone="warning"
          value={report.summary.pendingRegrades}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Lối tắt quản trị</CardTitle>
            <CardDescription>
              Truy cập nhanh các phân hệ cần thao tác thường xuyên trong môi trường minh họa hoặc thử nghiệm.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quickLinks.map((item) => (
              <div
                key={item.href}
                className="app-subtle-surface flex items-center justify-between gap-4 p-4"
              >
                <div>
                  <div className="font-semibold tracking-tight">{item.label}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </div>
                </div>
                <Link href={item.href}>
                <Button variant="outline">Truy cập</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Điểm nhấn vận hành</CardTitle>
            <CardDescription>
              Tóm tắt nhanh để theo dõi chất lượng dữ liệu và nhóm dữ liệu minh họa hiện tại.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
