import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { listCourseOfferings } from "@/features/course-offerings/queries";
import { listStudentEnrollments } from "@/features/enrollments/queries";
import { listStudentGrades } from "@/features/grades/queries";
import { listSemesters } from "@/features/semesters/queries";

export default async function StudentHomePage() {
  const [enrollments, grades, offerings, semesters] = await Promise.all([
    listStudentEnrollments(),
    listStudentGrades(),
    listCourseOfferings(),
    listSemesters(),
  ]);

  const currentSemester = semesters.find((semester) => semester.is_current);
  const offeringMap = new Map(offerings.map((offering) => [offering.id, offering]));
  const approvedGrades = grades.filter(
    (grade) => grade.status === "APPROVED" || grade.status === "LOCKED",
  );
  const cumulativeGpaValues = approvedGrades
    .map((grade) => grade.gpa_value)
    .filter((value): value is number => value !== null);
  const semesterGpaValues = approvedGrades
    .filter((grade) => {
      const offering = offeringMap.get(
        enrollments.find((enrollment) => enrollment.id === grade.enrollment_id)
          ?.course_offering_id ?? "",
      );
      return currentSemester ? offering?.semester_id === currentSemester.id : false;
    })
    .map((grade) => grade.gpa_value)
    .filter((value): value is number => value !== null);

  const semesterGpa =
    semesterGpaValues.length > 0
      ? (
          semesterGpaValues.reduce((sum, value) => sum + value, 0) /
          semesterGpaValues.length
        ).toFixed(2)
      : "0.00";
  const cumulativeGpa =
    cumulativeGpaValues.length > 0
      ? (
          cumulativeGpaValues.reduce((sum, value) => sum + value, 0) /
          cumulativeGpaValues.length
        ).toFixed(2)
      : "0.00";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Theo dõi lịch học, học phần đã đăng ký, kết quả học tập và các yêu cầu phúc khảo của bạn."
        title="Tổng quan sinh viên"
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          description="Học phần đang đăng ký trong học kỳ hiện tại"
          label="Học phần đã đăng ký"
          value={enrollments.filter((enrollment) => enrollment.status === "ENROLLED").length}
        />
        <StatCard
          description="GPA học kỳ hiện tại trên các học phần đã có điểm duyệt"
          label="GPA học kỳ"
          value={semesterGpa}
        />
        <StatCard
          description="GPA tích lũy trên các học phần đã duyệt hoặc khóa"
          label="GPA tích lũy"
          value={cumulativeGpa}
        />
      </div>
    </div>
  );
}
