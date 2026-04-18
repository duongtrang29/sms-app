import { FormAlert } from "@/components/forms/form-alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { listStudentEnrollments } from "@/features/enrollments/queries";
import { listStudentGrades } from "@/features/grades/queries";
import { createRegradeRequestFormAction } from "@/features/regrades/actions";
import { listStudentRegradeRequests } from "@/features/regrades/queries";

type StudentRegradeRequestsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StudentRegradeRequestsPage({
  searchParams,
}: StudentRegradeRequestsPageProps) {
  const resolvedSearchParams = await searchParams;
  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : undefined;
  const success =
    typeof resolvedSearchParams.success === "string"
      ? resolvedSearchParams.success
      : undefined;

  const [enrollments, grades, requests] = await Promise.all([
    listStudentEnrollments(),
    listStudentGrades(),
    listStudentRegradeRequests(),
  ]);

  const enrollmentMap = new Map(enrollments.map((enrollment) => [enrollment.id, enrollment]));
  const requestedGradeIds = new Set(requests.map((request) => request.grade_id));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Gửi yêu cầu phúc khảo cho các điểm đã được duyệt hoặc khóa, sau đó theo dõi trạng thái xử lý."
        title="Yêu cầu phúc khảo"
      />
      {error ? <FormAlert message={error} /> : null}
      {success ? <FormAlert message={success} success /> : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Tạo yêu cầu mới</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {grades.map((grade) => (
              <form
                key={grade.id}
                action={createRegradeRequestFormAction}
                className="flex flex-col gap-3 rounded-xl border border-border p-4"
              >
                <input name="grade_id" type="hidden" value={grade.id} />
                <input name="enrollment_id" type="hidden" value={grade.enrollment_id} />
                <input name="return_to" type="hidden" value="/student/regrade-requests" />
                <div className="text-sm font-medium">
                  Mã đăng ký {enrollmentMap.get(grade.enrollment_id)?.id} | Điểm tổng {grade.total_score ?? "Chưa có"}
                </div>
                <Input name="reason" placeholder="Lý do phúc khảo" />
                <Button disabled={requestedGradeIds.has(grade.id)} type="submit">
                  {requestedGradeIds.has(grade.id) ? "Đã gửi" : "Gửi phúc khảo"}
                </Button>
              </form>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Yêu cầu của tôi</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-border p-4 text-sm text-muted-foreground"
              >
                <StatusBadge value={request.status} />
                <div className="mt-1">{request.reason}</div>
                <div className="mt-1">Kết quả: {request.resolution_note ?? "Chưa có kết quả"}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
