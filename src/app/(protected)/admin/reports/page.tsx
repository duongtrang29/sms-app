import {
  AlertTriangleIcon,
  BarChart3Icon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  UserRoundIcon,
} from "lucide-react";
import dynamic from "next/dynamic";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { getAdminReportSnapshot } from "@/features/reports/queries";

const ReportsOverview = dynamic(
  () =>
    import("@/components/dashboard/reports-overview").then(
      (module) => module.ReportsOverview,
    ),
  {
    loading: () => (
      <div className="app-subtle-surface p-6 text-caption text-muted-foreground">
        Đang tải biểu đồ báo cáo...
      </div>
    ),
  },
);

export default async function AdminReportsPage() {
  const report = await getAdminReportSnapshot();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Tổng hợp chỉ số vận hành."
        icon={<BarChart3Icon className="size-5" />}
        info="Báo cáo tổng hợp phục vụ minh họa và kiểm tra nhanh cấu trúc dữ liệu, học vụ, điểm và mức độ sẵn sàng vận hành."
        title="Báo cáo"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Sinh viên đang còn hiệu lực học tập"
          icon={<GraduationCapIcon className="size-4" />}
          label="Sinh viên"
          tone="primary"
          value={report.summary.activeStudents}
        />
        <StatCard
          description="Giảng viên đã được cấp hồ sơ hệ thống"
          icon={<UserRoundIcon className="size-4" />}
          label="Giảng viên"
          tone="info"
          value={report.summary.totalLecturers}
        />
        <StatCard
          description="Học phần còn trong trạng thái mở"
          icon={<ClipboardListIcon className="size-4" />}
          label="Học phần đang mở"
          tone="success"
          value={report.summary.openOfferings}
        />
        <StatCard
          description="Bảng điểm đang chờ quản trị viên duyệt"
          icon={<ClipboardCheckIcon className="size-4" />}
          label="Điểm chờ duyệt"
          tone="warning"
          value={report.summary.submittedGrades}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Yêu cầu phúc khảo còn đang chờ xử lý"
          label="Phúc khảo chờ xử lý"
          tone="warning"
          value={report.summary.pendingRegrades}
        />
        <StatCard
          description="Sinh viên thuộc diện cảnh báo học vụ"
          icon={<AlertTriangleIcon className="size-4" />}
          label="Cảnh báo học vụ"
          tone="danger"
          value={report.summary.activeWarnings}
        />
        <StatCard
          description="Bản ghi tài khoản được gắn nhãn minh họa"
          label="Hồ sơ minh họa"
          tone="info"
          value={report.summary.demoRows}
        />
        <StatCard
          description="Bản ghi tài khoản không thuộc nhóm minh họa"
          label="Hồ sơ dữ liệu thật"
          tone="neutral"
          value={report.summary.liveRows}
        />
      </div>
      <ReportsOverview
        classGpa={report.classGpa}
        departmentDistribution={report.departmentDistribution}
        passRates={report.passRates}
        warnings={report.warnings}
      />
    </div>
  );
}
