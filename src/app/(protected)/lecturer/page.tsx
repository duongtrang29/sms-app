import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { listAssignedOfferingsForLecturer } from "@/features/grades/queries";
import { listRegradeReviewRows } from "@/features/regrades/queries";

export default async function LecturerHomePage() {
  const [assignedOfferings, regradeRows] = await Promise.all([
    listAssignedOfferingsForLecturer(),
    listRegradeReviewRows("LECTURER"),
  ]);

  const activeQueueCount = regradeRows.filter(
    (row) => row.status === "PENDING" || row.status === "UNDER_REVIEW",
  ).length;
  const openOfferingCount = assignedOfferings.filter(
    (offering) => offering.status === "OPEN",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Không gian làm việc cho giảng viên: lớp học phần được phân công, lịch giảng dạy, bảng điểm và phúc khảo."
        title="Tổng quan giảng viên"
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          description="Tổng số lớp học phần bạn đang phụ trách"
          label="Lớp được phân công"
          value={assignedOfferings.length}
        />
        <StatCard
          description="Yêu cầu phúc khảo còn cần theo dõi"
          label="Hàng đợi phúc khảo"
          value={activeQueueCount}
        />
        <StatCard
          description="Lớp học phần vẫn đang mở hoặc đang vận hành"
          label="Học phần đang vận hành"
          value={openOfferingCount}
        />
      </div>
    </div>
  );
}
