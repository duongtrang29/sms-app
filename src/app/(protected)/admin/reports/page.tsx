import { ReportsOverview } from "@/components/dashboard/reports-overview";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { getAdminReportSnapshot } from "@/features/reports/queries";

export default async function AdminReportsPage() {
  const report = await getAdminReportSnapshot();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Báo cáo tổng hợp phục vụ minh họa và kiểm tra nhanh cấu trúc dữ liệu, học vụ, điểm và mức độ sẵn sàng vận hành."
        eyebrow="Khu quản trị"
        title="Báo cáo và thống kê"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Sinh viên đang còn hiệu lực học tập"
          label="Sinh viên"
          tone="primary"
          value={report.summary.activeStudents}
        />
        <StatCard
          description="Giảng viên đã được cấp hồ sơ hệ thống"
          label="Giảng viên"
          tone="info"
          value={report.summary.totalLecturers}
        />
        <StatCard
          description="Học phần còn trong trạng thái mở"
          label="Học phần đang mở"
          tone="success"
          value={report.summary.openOfferings}
        />
        <StatCard
          description="Bảng điểm đang chờ quản trị viên duyệt"
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
