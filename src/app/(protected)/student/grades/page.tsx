import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { listCourses } from "@/features/courses/queries";
import { listCourseOfferings } from "@/features/course-offerings/queries";
import { listStudentEnrollments } from "@/features/enrollments/queries";
import { listStudentGrades } from "@/features/grades/queries";
import { listSemesters } from "@/features/semesters/queries";
import { formatScore } from "@/lib/format";

export default async function StudentGradesPage() {
  const [courses, enrollments, grades, offerings, semesters] = await Promise.all([
    listCourses(),
    listStudentEnrollments(),
    listStudentGrades(),
    listCourseOfferings(),
    listSemesters(),
  ]);

  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const offeringMap = new Map(offerings.map((offering) => [offering.id, offering]));
  const semesterMap = new Map(semesters.map((semester) => [semester.id, semester]));
  const enrollmentMap = new Map(enrollments.map((enrollment) => [enrollment.id, enrollment]));

  const gpaValues = grades.map((grade) => grade.gpa_value).filter((value): value is number => value !== null);
  const cumulativeGpa =
    gpaValues.length > 0
      ? (gpaValues.reduce((sum, value) => sum + value, 0) / gpaValues.length).toFixed(2)
      : "0.00";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Xem điểm thành phần, điểm tổng, GPA và trạng thái xử lý của từng học phần."
        title="Kết quả học tập"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard description="Trung bình theo hệ 4 trên các học phần đã có điểm" label="GPA tích lũy" value={cumulativeGpa} />
        <StatCard description="Số học phần đã có điểm" label="Học phần đã chấm" value={grades.length} />
        <StatCard description="Học phần đã được duyệt hoặc khóa điểm" label="Đã duyệt / đã khóa" value={grades.filter((grade) => grade.status === "APPROVED" || grade.status === "LOCKED").length} />
      </div>
      {grades.length ? (
        <div className="grid gap-4">
          {grades.map((grade) => {
            const enrollment = enrollmentMap.get(grade.enrollment_id);
            const offering = enrollment ? offeringMap.get(enrollment.course_offering_id) : null;
            const course = offering ? courseMap.get(offering.course_id) : null;
            const semester = offering ? semesterMap.get(offering.semester_id) : null;

            return (
              <Card key={grade.id} className="shadow-none">
                <CardHeader>
                  <CardTitle>
                    {course?.code} - {course?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm leading-6 text-muted-foreground md:grid-cols-3">
                  <div>{semester?.code} | Nhóm {offering?.section_code}</div>
                  <div>Điểm tổng: {formatScore(grade.total_score)} | GPA: {formatScore(grade.gpa_value)}</div>
                  <div className="flex items-center gap-2">
                    Trạng thái:
                    <StatusBadge value={grade.status} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          description="Điểm sẽ xuất hiện tại đây sau khi bạn đăng ký học phần và giảng viên bắt đầu nhập bảng điểm."
          title="Chưa có kết quả học tập"
        />
      )}
    </div>
  );
}
