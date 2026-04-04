import { notFound } from "next/navigation";

import { FormAlert } from "@/components/forms/form-alert";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  saveGradeFormAction,
  submitOfferingGradesFormAction,
} from "@/features/grades/actions";
import { listOfferingGradebook } from "@/features/grades/queries";
import { formatScore } from "@/lib/format";

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

  const gradeMap = new Map(
    gradebook.grades.map((grade) => [grade.enrollment_id, grade]),
  );
  const studentMap = new Map(
    gradebook.students.map((student) => [student.id, student.student_code]),
  );
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
        actions={
          <form action={submitOfferingGradesFormAction}>
            <input name="offering_id" type="hidden" value={offeringId} />
            <Button type="submit" variant="outline">
              Gửi duyệt toàn bộ
            </Button>
          </form>
        }
        description="Giảng viên nhập điểm thành phần, lưu nháp hoặc gửi duyệt. Điểm tổng và GPA được cơ sở dữ liệu tính tự động."
        eyebrow="Khu giảng viên"
        title={`Bảng điểm ${gradebook.course?.code ?? ""} - nhóm ${offering.section_code}`}
      />
      {error ? <FormAlert message={error} /> : null}
      {success ? <FormAlert message={success} success /> : null}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          description="Tổng sinh viên đang có trong lớp học phần."
          label="Số đăng ký"
          tone="primary"
          value={gradebook.enrollments.length}
        />
        <StatCard
          description="Bản ghi điểm còn ở trạng thái nháp."
          label="Nháp"
          tone="warning"
          value={draftCount}
        />
        <StatCard
          description="Bản ghi điểm đã khóa và không còn cho chỉnh sửa."
          label="Đã khóa"
          tone="neutral"
          value={lockedCount}
        />
      </div>
      {submittedCount ? (
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--color-warning)]/15 bg-[color:var(--color-warning-soft)] px-3 py-1.5 text-sm text-[color:var(--color-warning-foreground)]">
          <span className="app-status-dot bg-[color:var(--color-warning)]" />
          {submittedCount} bản ghi đang chờ quản trị viên duyệt.
        </div>
      ) : null}
      {gradebook.enrollments.length ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Danh sách nhập điểm</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="hidden grid-cols-[1.45fr_repeat(4,minmax(0,0.78fr))_0.9fr_auto] gap-3 rounded-2xl bg-muted/40 px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground xl:grid">
              <div>Sinh viên</div>
              <div>Chuyên cần</div>
              <div>Giữa kỳ</div>
              <div>Cuối kỳ</div>
              <div>Ghi chú</div>
              <div>Trạng thái</div>
              <div>Lưu</div>
            </div>
            {gradebook.enrollments.map((enrollment) => {
              const grade = gradeMap.get(enrollment.id);
              const studentName = gradebook.profiles[enrollment.student_id];
              const studentCode = studentMap.get(enrollment.student_id);

              return (
                <form
                  action={saveGradeFormAction}
                  className="app-subtle-surface grid gap-3 p-4 xl:grid-cols-[1.45fr_repeat(4,minmax(0,0.78fr))_0.9fr_auto] xl:items-center"
                  key={enrollment.id}
                >
                  <input name="enrollment_id" type="hidden" value={enrollment.id} />
                  <input name="offering_id" type="hidden" value={offeringId} />
                  <div className="flex flex-col gap-2">
                    <div className="font-semibold tracking-tight">
                      {studentCode} - {studentName}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <StatusBadge value={grade?.status ?? "DRAFT"} />
                      <span>Tổng: {formatScore(grade?.total_score)}</span>
                    </div>
                  </div>
                  <Input
                    defaultValue={grade?.attendance_score ?? ""}
                    max={10}
                    min={0}
                    name="attendance_score"
                    placeholder="CC"
                    step="0.1"
                    type="number"
                  />
                  <Input
                    defaultValue={grade?.midterm_score ?? ""}
                    max={10}
                    min={0}
                    name="midterm_score"
                    placeholder="GK"
                    step="0.1"
                    type="number"
                  />
                  <Input
                    defaultValue={grade?.final_score ?? ""}
                    max={10}
                    min={0}
                    name="final_score"
                    placeholder="CK"
                    step="0.1"
                    type="number"
                  />
                  <Input
                    defaultValue={grade?.remark ?? ""}
                    name="remark"
                    placeholder="Ghi chú"
                  />
                  <select
                    className="app-native-select"
                    defaultValue={grade?.status ?? "DRAFT"}
                    name="status"
                  >
                    <option value="DRAFT">Lưu nháp</option>
                    <option value="SUBMITTED">Gửi duyệt</option>
                  </select>
                  <Button type="submit">Lưu</Button>
                </form>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          description="Học phần này chưa có sinh viên đăng ký, nên hiện chưa có dòng dữ liệu để nhập điểm."
          title="Chưa có sinh viên trong lớp"
        />
      )}
    </div>
  );
}
