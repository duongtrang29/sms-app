import { RegradeReviewList } from "@/components/dashboard/regrade-review-list";
import { FormAlert } from "@/components/forms/form-alert";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { listRegradeReviewRows } from "@/features/regrades/queries";

type LecturerRegradeRequestsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LecturerRegradeRequestsPage({
  searchParams,
}: LecturerRegradeRequestsPageProps) {
  const resolvedSearchParams = await searchParams;
  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : undefined;
  const success =
    typeof resolvedSearchParams.success === "string"
      ? resolvedSearchParams.success
      : undefined;
  const requests = await listRegradeReviewRows("LECTURER");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Giảng viên xem và phản hồi các yêu cầu phúc khảo thuộc học phần mình phụ trách."
        title="Xử lý phúc khảo"
      />
      {error ? <FormAlert message={error} /> : null}
      {success ? <FormAlert message={success} success /> : null}
      {requests.length ? (
        <RegradeReviewList returnTo="/lecturer/regrade-requests" rows={requests} />
      ) : (
        <EmptyState
          description="Hiện chưa có yêu cầu phúc khảo nào thuộc lớp học phần bạn được phân công."
          title="Không có yêu cầu phúc khảo"
        />
      )}
    </div>
  );
}
