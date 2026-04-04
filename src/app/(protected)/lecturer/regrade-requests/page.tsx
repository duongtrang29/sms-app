import { RegradeReviewList } from "@/components/dashboard/regrade-review-list";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { listRegradeReviewRows } from "@/features/regrades/queries";

export default async function LecturerRegradeRequestsPage() {
  const requests = await listRegradeReviewRows("LECTURER");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Giảng viên xem và phản hồi các yêu cầu phúc khảo thuộc học phần mình phụ trách."
        title="Xử lý phúc khảo"
      />
      {requests.length ? (
        <RegradeReviewList rows={requests} />
      ) : (
        <EmptyState
          description="Hiện chưa có yêu cầu phúc khảo nào thuộc lớp học phần bạn được phân công."
          title="Không có yêu cầu phúc khảo"
        />
      )}
    </div>
  );
}
