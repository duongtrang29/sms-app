import { StudentGradesBoard } from "@/components/grades/student-grades-board";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { listCoursesByIds } from "@/features/courses/queries";
import { listCourseOfferingsByIds } from "@/features/course-offerings/queries";
import { listStudentEnrollments } from "@/features/enrollments/queries";
import { listStudentGrades } from "@/features/grades/queries";
import { listStudentRegradeRequests } from "@/features/regrades/queries";
import { listSemestersByIds } from "@/features/semesters/queries";

export default async function StudentGradesPage() {
  const [enrollments, grades, regradeRequests] = await Promise.all([
    listStudentEnrollments(),
    listStudentGrades(),
    listStudentRegradeRequests(),
  ]);

  const offeringIds = [
    ...new Set(enrollments.map((enrollment) => enrollment.course_offering_id)),
  ];
  const offerings = await listCourseOfferingsByIds(offeringIds);

  const courseIds = [...new Set(offerings.map((offering) => offering.course_id))];
  const semesterIds = [...new Set(offerings.map((offering) => offering.semester_id))];

  const [courses, semesters] = await Promise.all([
    listCoursesByIds(courseIds),
    listSemestersByIds(semesterIds),
  ]);

  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const offeringMap = new Map(offerings.map((offering) => [offering.id, offering]));
  const semesterMap = new Map(semesters.map((semester) => [semester.id, semester]));
  const enrollmentMap = new Map(enrollments.map((enrollment) => [enrollment.id, enrollment]));
  const pendingRegradeGradeIds = new Set(
    regradeRequests
      .filter((request) => request.status === "PENDING")
      .map((request) => request.grade_id),
  );

  const currentSemesterId =
    semesters.find((semester) => semester.is_current)?.id ?? null;

  const rows = grades
    .filter((grade) => grade.status === "APPROVED" || grade.status === "LOCKED")
    .map((grade) => {
      const enrollment = enrollmentMap.get(grade.enrollment_id);
      const offering = enrollment
        ? offeringMap.get(enrollment.course_offering_id)
        : null;
      const course = offering ? courseMap.get(offering.course_id) : null;
      const semester = offering ? semesterMap.get(offering.semester_id) : null;

      return {
        attendanceScore: grade.attendance_score,
        courseCode: course?.code ?? "N/A",
        courseName: course?.name ?? "Chưa có tên môn học",
        enrollmentId: grade.enrollment_id,
        finalScore: grade.final_score,
        gpaValue: grade.gpa_value,
        gradeId: grade.id,
        hasPendingRegrade: pendingRegradeGradeIds.has(grade.id),
        letterGrade: grade.letter_grade,
        midtermScore: grade.midterm_score,
        sectionCode: offering?.section_code ?? "N/A",
        semesterCode: semester?.code ?? "N/A",
        semesterId: offering?.semester_id ?? null,
        status: grade.status,
        totalScore: grade.total_score,
      };
    });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Chỉ hiển thị các điểm đã được duyệt hoặc đã khóa. Bạn có thể gửi yêu cầu phúc khảo trực tiếp từ từng học phần."
        title="Kết quả học tập"
      />
      {rows.length ? (
        <StudentGradesBoard currentSemesterId={currentSemesterId} rows={rows} />
      ) : (
        <EmptyState
          description="Điểm sẽ xuất hiện sau khi giảng viên nhập và admin duyệt bảng điểm."
          title="Chưa có kết quả học tập"
        />
      )}
    </div>
  );
}

