import { RotateCcwIcon } from "lucide-react";

import { RegradeReviewList } from "@/components/dashboard/regrade-review-list";
import { FormAlert } from "@/components/forms/form-alert";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { listRegradeReviewRows } from "@/features/regrades/queries";

type AdminRegradeRequestsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminRegradeRequestsPage({
  searchParams,
}: AdminRegradeRequestsPageProps) {
  const resolvedSearchParams = await searchParams;
  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : undefined;
  const success =
    typeof resolvedSearchParams.success === "string"
      ? resolvedSearchParams.success
      : undefined;
  const rows = await listRegradeReviewRows("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Rà soát yêu cầu phúc khảo toàn hệ thống."
        icon={<RotateCcwIcon className="size-5" />}
        info="Quản trị viên có thể rà lại toàn bộ yêu cầu phúc khảo để phối hợp với giảng viên, kiểm tra lịch sử điểm và can thiệp khi cần."
        title="Phúc khảo"
      />
      {error ? <FormAlert message={error} /> : null}
      {success ? <FormAlert message={success} success /> : null}
      {rows.length ? (
        <RegradeReviewList returnTo="/admin/regrade-requests" rows={rows} />
      ) : (
        <EmptyState
          description="Hiện chưa có yêu cầu phúc khảo nào cần quản trị viên theo dõi."
          icon={<RotateCcwIcon className="size-5" />}
          title="Không có yêu cầu phúc khảo"
        />
      )}
    </div>
  );
}
