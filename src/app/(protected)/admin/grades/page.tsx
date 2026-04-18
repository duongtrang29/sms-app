import Link from "next/link";
import {
  CheckIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  LockIcon,
  LockOpenIcon,
} from "lucide-react";

import { FormAlert } from "@/components/forms/form-alert";
import { AdminGradesTable } from "@/components/dashboard/admin-grades-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { transitionOfferingGradesFormAction } from "@/features/admin-grades/actions";
import {
  listAdminGradeReviewSnapshot,
  type AdminGradeFilter,
} from "@/features/admin-grades/queries";

type AdminGradesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const allowedFilters: AdminGradeFilter[] = [
  "ALL",
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "LOCKED",
];

const gradeFilterLabelMap: Record<AdminGradeFilter, string> = {
  ALL: "Tất cả",
  APPROVED: "Đã duyệt",
  DRAFT: "Nháp",
  LOCKED: "Đã khóa",
  SUBMITTED: "Chờ duyệt",
};

function resolveGradeFilter(value: string | string[] | undefined): AdminGradeFilter {
  return typeof value === "string" && allowedFilters.includes(value as AdminGradeFilter)
    ? (value as AdminGradeFilter)
    : "ALL";
}

export default async function AdminGradesPage({
  searchParams,
}: AdminGradesPageProps) {
  const resolvedSearchParams = await searchParams;
  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : undefined;
  const success =
    typeof resolvedSearchParams.success === "string"
      ? resolvedSearchParams.success
      : undefined;
  const currentFilter = resolveGradeFilter(resolvedSearchParams.status);
  const snapshot = await listAdminGradeReviewSnapshot(currentFilter);
  const returnTo =
    currentFilter === "ALL"
      ? "/admin/grades"
      : `/admin/grades?status=${currentFilter}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            {allowedFilters.map((filter) => (
              <Link
                key={filter}
                href={filter === "ALL" ? "/admin/grades" : `/admin/grades?status=${filter}`}
              >
                <Button
                  type="button"
                  variant={currentFilter === filter ? "default" : "outline"}
                >
                  {gradeFilterLabelMap[filter]}
                </Button>
              </Link>
            ))}
          </div>
        }
        description="Kiểm soát workflow điểm toàn hệ thống."
        icon={<ClipboardCheckIcon className="size-5" />}
        info="Quản trị viên duyệt, khóa và mở khóa điểm theo quy trình Nháp → Chờ duyệt → Đã duyệt → Đã khóa mà cơ sở dữ liệu đã kiểm soát."
        title="Duyệt điểm"
      />
      {error ? <FormAlert message={error} /> : null}
      {success ? <FormAlert message={success} success /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          description="Tổng bản ghi điểm hiện có"
          icon={<FileTextIcon className="size-4" />}
          label="Tất cả điểm"
          tone="primary"
          value={snapshot.summary.ALL}
        />
        <StatCard
          description="Điểm giảng viên đang nhập hoặc còn nháp"
          icon={<FileTextIcon className="size-4" />}
          label="Nháp"
          tone="warning"
          value={snapshot.summary.DRAFT}
        />
        <StatCard
          description="Điểm đã được giảng viên gửi duyệt"
          icon={<ClipboardCheckIcon className="size-4" />}
          label="Chờ duyệt"
          tone="warning"
          value={snapshot.summary.SUBMITTED}
        />
        <StatCard
          description="Điểm đã được quản trị viên duyệt"
          icon={<CheckIcon className="size-4" />}
          label="Đã duyệt"
          tone="success"
          value={snapshot.summary.APPROVED}
        />
        <StatCard
          description="Điểm đã khóa, chỉ quản trị viên mới được mở lại"
          icon={<LockIcon className="size-4" />}
          label="Đã khóa"
          tone="neutral"
          value={snapshot.summary.LOCKED}
        />
      </div>
      <SectionPanel
        description="Duyệt, khóa hoặc mở lại điểm theo từng học phần."
        title="Xử lý theo học phần"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.offeringSummaries.length ? (
            snapshot.offeringSummaries.slice(0, 9).map((offering) => (
              <div
                key={offering.offering_id}
                className="app-subtle-surface p-5"
              >
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold tracking-tight">
                      {offering.course_code} - {offering.course_name}
                    </div>
                    <div className="text-sm leading-6 text-muted-foreground">
                      {offering.semester_code} | Nhóm {offering.section_code}
                    </div>
                  </div>
                  <div className="text-sm leading-6 text-muted-foreground">
                    Chờ duyệt {offering.submitted_count} | Đã duyệt {offering.approved_count} |
                    Đã khóa {offering.locked_count} | Tổng {offering.total_count}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={transitionOfferingGradesFormAction}>
                      <input name="current_status" type="hidden" value="SUBMITTED" />
                      <input name="next_status" type="hidden" value="APPROVED" />
                      <input name="offering_id" type="hidden" value={offering.offering_id} />
                      <input name="return_to" type="hidden" value={returnTo} />
                      <Button
                        disabled={offering.submitted_count === 0}
                        size="sm"
                        type="submit"
                      >
                        <CheckIcon data-icon="inline-start" />
                        Duyệt theo học phần
                      </Button>
                    </form>
                    <form action={transitionOfferingGradesFormAction}>
                      <input name="current_status" type="hidden" value="APPROVED" />
                      <input name="next_status" type="hidden" value="LOCKED" />
                      <input name="offering_id" type="hidden" value={offering.offering_id} />
                      <input name="return_to" type="hidden" value={returnTo} />
                      <Button
                        disabled={offering.approved_count === 0}
                        size="sm"
                        type="submit"
                        variant="outline"
                      >
                        <LockIcon data-icon="inline-start" />
                        Khóa theo học phần
                      </Button>
                    </form>
                    <form action={transitionOfferingGradesFormAction}>
                      <input name="current_status" type="hidden" value="LOCKED" />
                      <input name="next_status" type="hidden" value="APPROVED" />
                      <input name="offering_id" type="hidden" value={offering.offering_id} />
                      <input name="return_to" type="hidden" value={returnTo} />
                      <Button
                        disabled={offering.locked_count === 0}
                        size="sm"
                        type="submit"
                        variant="secondary"
                      >
                        <LockOpenIcon data-icon="inline-start" />
                        Mở khóa theo học phần
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState
                description="Chưa có học phần nào đủ dữ liệu để thực hiện thao tác hàng loạt."
                title="Không có học phần phù hợp"
              />
            </div>
          )}
        </div>
      </SectionPanel>
      <AdminGradesTable data={snapshot.rows} returnTo={returnTo} />
    </div>
  );
}
