import { RotateCcwIcon } from "lucide-react";

import { RegradeReviewList } from "@/components/dashboard/regrade-review-list";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { listRegradeReviewRows } from "@/features/regrades/queries";

export default async function AdminRegradeRequestsPage() {
  const rows = await listRegradeReviewRows("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Rà soát yêu cầu phúc khảo toàn hệ thống."
        icon={<RotateCcwIcon className="size-5" />}
        info="Quản trị viên có thể rà lại toàn bộ yêu cầu phúc khảo để phối hợp với giảng viên, kiểm tra lịch sử điểm và can thiệp khi cần."
        title="Phúc khảo"
      />
      {rows.length ? (
        <RegradeReviewList rows={rows} />
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
