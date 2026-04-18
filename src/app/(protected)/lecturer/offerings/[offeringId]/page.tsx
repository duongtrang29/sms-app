import { notFound } from "next/navigation";

import { LecturerGradeInputTable } from "@/components/grades/lecturer-grade-input-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { listOfferingGradebook } from "@/features/grades/queries";

type GradebookPageProps = {
  params: Promise<{ offeringId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GradebookPage({
  params,
  searchParams,
}: GradebookPageProps) {
  const { offeringId } = await params;
  const resolvedSearchParams = await searchParams;
  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : undefined;
  const success =
    typeof resolvedSearchParams.success === "string"
      ? resolvedSearchParams.success
      : undefined;

  const gradebook = await listOfferingGradebook(offeringId);
  const offering = gradebook.offering;

  if (!offering) {
    notFound();
  }

  const studentMap = new Map(
    gradebook.students.map((student) => [student.id, student.student_code]),
  );
  const studentCodes = Object.fromEntries(studentMap.entries());

  const submittedCount = gradebook.grades.filter(
    (grade) => grade.status === "SUBMITTED",
  ).length;
  const draftCount = gradebook.grades.filter(
    (grade) => grade.status === "DRAFT",
  ).length;
  const lockedCount = gradebook.grades.filter(
    (grade) => grade.status === "LOCKED",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Nhập điểm thành phần trực tiếp trên bảng, tự lưu nháp khi rời ô và gửi duyệt tập trung khi đã hoàn tất."
        eyebrow="Khu giảng viên"
        title={`Bảng điểm ${gradebook.course?.code ?? ""} - nhóm ${offering.section_code}`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          description="Tổng sinh viên đang có trong lớp học phần."
          label="Số đăng ký"
          tone="primary"
          value={gradebook.enrollments.length}
        />
        <StatCard
          description="Bản ghi điểm còn ở trạng thái nháp."
          label="DRAFT"
          tone="warning"
          value={draftCount}
        />
        <StatCard
          description="Bản ghi điểm đã khóa và không còn cho chỉnh sửa."
          label="LOCKED"
          tone="neutral"
          value={lockedCount}
        />
      </div>

      {submittedCount > 0 ? (
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--color-warning)]/15 bg-[color:var(--color-warning-soft)] px-3 py-1.5 text-sm text-[color:var(--color-warning-foreground)]">
          <span className="app-status-dot bg-[color:var(--color-warning)]" />
          {submittedCount} bản ghi đang chờ quản trị viên duyệt.
        </div>
      ) : null}

      {gradebook.enrollments.length ? (
        <LecturerGradeInputTable
          enrollments={gradebook.enrollments}
          grades={gradebook.grades}
          initialError={error}
          initialSuccess={success}
          offeringId={offeringId}
          studentCodes={studentCodes}
          studentNames={gradebook.profiles}
          weights={{
            attendance: offering.attendance_weight,
            midterm: offering.midterm_weight,
            final: offering.final_weight,
          }}
        />
      ) : (
        <EmptyState
          description="Học phần này chưa có sinh viên đăng ký, nên hiện chưa có dòng dữ liệu để nhập điểm."
          title="Chưa có sinh viên trong lớp"
        />
      )}
    </div>
  );
}
