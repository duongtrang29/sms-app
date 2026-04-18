import {
  AlertTriangleIcon,
  BarChart3Icon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  UserRoundIcon,
} from "lucide-react";
import { Suspense } from "react";

import { ReportsOverviewLazy } from "@/components/dashboard/reports-overview-lazy";
import { ReportsExportButton } from "@/components/dashboard/reports-export-button";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { getAdminReportSnapshot } from "@/features/reports/queries";

function AdminReportsSkeleton() {
  return (
    <div className="app-subtle-surface p-6 text-caption text-muted-foreground">
      Đang tải dữ liệu báo cáo...
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<AdminReportsSkeleton />}>
      <AdminReportsPageContent />
    </Suspense>
  );
}

async function AdminReportsPageContent() {
  const report = await getAdminReportSnapshot();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <ReportsExportButton
            classGpa={report.classGpa}
            departmentDistribution={report.departmentDistribution}
            passRates={report.passRates}
            warnings={report.warnings}
          />
        }
        description="Tổng hợp chỉ số vận hành."
        icon={<BarChart3Icon className="size-5" />}
        info="Báo cáo tổng hợp phục vụ minh họa và kiểm tra nhanh cấu trúc dữ liệu, học vụ, điểm và mức độ sẵn sàng vận hành."
        title="Báo cáo"
      />
      {report.missingViews.length ? (
        <div className="space-y-3 rounded-lg border border-[color:var(--color-warning)]/40 bg-[color:var(--color-warning-soft)] p-4">
          <div className="text-sm font-semibold text-[color:var(--color-warning-foreground)]">
            Thiếu DB view báo cáo: {report.missingViews.join(", ")}
          </div>
          <div className="text-sm text-[color:var(--color-warning-foreground)]">
            Chạy SQL bên dưới trong Supabase SQL Editor để tạo lại view.
          </div>
          <pre className="touch-scroll max-h-[320px] overflow-auto rounded-md border border-[color:var(--color-warning)]/30 bg-white p-3 text-xs leading-6 text-slate-700">
            <code>{report.missingViewSql}</code>
          </pre>
        </div>
      ) : null}
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
      <Suspense
        fallback={
          <div className="app-subtle-surface p-6 text-caption text-muted-foreground">
            Đang tải biểu đồ báo cáo...
          </div>
        }
      >
        <ReportsOverviewLazy
          classGpa={report.classGpa}
          departmentDistribution={report.departmentDistribution}
          passRates={report.passRates}
          warnings={report.warnings}
        />
      </Suspense>
    </div>
  );
}
