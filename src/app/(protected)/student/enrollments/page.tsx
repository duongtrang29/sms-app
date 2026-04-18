import { StudentEnrollmentBoard } from "@/components/enrollment/student-enrollment-board";
import { PageHeader } from "@/components/shared/page-header";
import { QueryToast } from "@/components/shared/query-toast";
import { StatCard } from "@/components/shared/stat-card";
import { Suspense } from "react";
import { listCoursesByIds } from "@/features/courses/queries";
import {
  listCourseOfferingsByIds,
  listPrimaryTeachingAssignmentsForOfferings,
} from "@/features/course-offerings/queries";
import {
  listOpenOfferingsForStudent,
  listSchedulesForOfferings,
  listStudentEnrollments,
} from "@/features/enrollments/queries";
import { listLecturersByIds } from "@/features/lecturers/queries";
import { listSemestersByIds } from "@/features/semesters/queries";

type StudentEnrollmentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function StudentEnrollmentsPage({
  searchParams,
}: StudentEnrollmentsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="app-subtle-surface p-6 text-caption text-muted-foreground">
          Đang tải dữ liệu đăng ký học phần...
        </div>
      }
    >
      <StudentEnrollmentsPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function StudentEnrollmentsPageContent({
  searchParams,
}: StudentEnrollmentsPageProps) {
  const resolvedSearchParams = await searchParams;
  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : undefined;
  const success =
    typeof resolvedSearchParams.success === "string"
      ? resolvedSearchParams.success
      : undefined;

  const [enrollments, openOfferings] = await Promise.all([
    listStudentEnrollments(),
    listOpenOfferingsForStudent(),
  ]);

  const allOfferingIds = [
    ...new Set([
      ...openOfferings.map((offering) => offering.id),
      ...enrollments.map((enrollment) => enrollment.course_offering_id),
    ]),
  ];

  const [allOfferings, primaryAssignments, schedules] = await Promise.all([
    listCourseOfferingsByIds(allOfferingIds),
    listPrimaryTeachingAssignmentsForOfferings(allOfferingIds),
    listSchedulesForOfferings(allOfferingIds),
  ]);

  const courseIds = [...new Set(allOfferings.map((offering) => offering.course_id))];
  const semesterIds = [
    ...new Set(allOfferings.map((offering) => offering.semester_id)),
  ];
  const lecturerIds = [
    ...new Set(primaryAssignments.map((assignment) => assignment.lecturer_id)),
  ];

  const [courses, lecturers, semesters] = await Promise.all([
    listCoursesByIds(courseIds),
    listLecturersByIds(lecturerIds),
    listSemestersByIds(semesterIds),
  ]);

  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const lecturerMap = new Map(lecturers.map((lecturer) => [lecturer.id, lecturer]));
  const semesterMap = new Map(semesters.map((semester) => [semester.id, semester]));
  const assignmentMap = new Map(
    primaryAssignments.map((assignment) => [
      assignment.course_offering_id,
      assignment.lecturer_id,
    ]),
  );
  const offeringMap = new Map(allOfferings.map((offering) => [offering.id, offering]));
  const enrolledOfferingIds = new Set(
    enrollments
      .filter((item) => item.status === "ENROLLED")
      .map((item) => item.course_offering_id),
  );
  const activeEnrollments = enrollments.filter(
    (item) => item.status === "ENROLLED",
  );
  const registeredCredits = activeEnrollments.reduce((sum, enrollment) => {
    const offering = offeringMap.get(enrollment.course_offering_id);
    const course = offering ? courseMap.get(offering.course_id) : null;
    return sum + (course?.credit_hours ?? 0);
  }, 0);

  const scheduleByOffering = new Map<
    string,
    Array<{
      day_of_week: number;
      end_time: string;
      start_time: string;
    }>
  >();
  schedules.forEach((schedule) => {
    const existingSlots = scheduleByOffering.get(schedule.course_offering_id) ?? [];
    existingSlots.push({
      day_of_week: schedule.day_of_week,
      end_time: schedule.end_time,
      start_time: schedule.start_time,
    });
    scheduleByOffering.set(schedule.course_offering_id, existingSlots);
  });

  const openCards = openOfferings
    .filter((offering) => !enrolledOfferingIds.has(offering.id))
    .map((offering) => {
      const course = courseMap.get(offering.course_id);
      const semester = semesterMap.get(offering.semester_id);
      const lecturer = lecturerMap.get(assignmentMap.get(offering.id) ?? "");

      return {
        courseCode: course?.code ?? "N/A",
        courseName: course?.name ?? "Chưa có tên môn học",
        creditHours: course?.credit_hours ?? 0,
        enrolledCount: offering.enrolled_count,
        lecturerName: lecturer?.full_name ?? "Chưa gán giảng viên",
        maxCapacity: offering.max_capacity,
        offeringId: offering.id,
        offeringStatus: offering.status,
        registrationCloseAt: offering.registration_close_at,
        registrationOpenAt: offering.registration_open_at,
        schedules: scheduleByOffering.get(offering.id) ?? [],
        sectionCode: offering.section_code,
        semesterCode: semester?.code ?? "N/A",
      };
    });

  const enrolledCards = enrollments
    .filter((enrollment) => enrollment.status === "ENROLLED")
    .map((enrollment) => {
      const offering = offeringMap.get(enrollment.course_offering_id);
      const course = offering ? courseMap.get(offering.course_id) : null;
      const semester = offering ? semesterMap.get(offering.semester_id) : null;
      const lecturer = offering
        ? lecturerMap.get(assignmentMap.get(offering.id) ?? "")
        : null;

      return {
        courseCode: course?.code ?? "N/A",
        courseName: course?.name ?? "Chưa có tên môn học",
        creditHours: course?.credit_hours ?? 0,
        enrolledCount: offering?.enrolled_count ?? 0,
        enrollmentId: enrollment.id,
        lecturerName: lecturer?.full_name ?? "Chưa gán giảng viên",
        maxCapacity: offering?.max_capacity ?? 0,
        offeringId: enrollment.course_offering_id,
        offeringStatus: offering?.status ?? "CLOSED",
        registrationCloseAt: offering?.registration_close_at ?? "",
        registrationOpenAt: offering?.registration_open_at ?? "",
        schedules: scheduleByOffering.get(enrollment.course_offering_id) ?? [],
        sectionCode: offering?.section_code ?? "N/A",
        semesterCode: semester?.code ?? "N/A",
        status: enrollment.status,
      };
    });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Danh sách học phần đang mở và các học phần bạn đã đăng ký. Mọi kiểm tra trùng lịch, tín chỉ, tiên quyết và sĩ số đều chạy ở phía máy chủ."
        eyebrow="Khu sinh viên"
        title="Đăng ký học phần"
      />
      <QueryToast error={error} success={success} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          description="Học phần còn trong cửa sổ mở đăng ký."
          label="Học phần đang mở"
          tone="info"
          value={openOfferings.length}
        />
        <StatCard
          description="Số học phần bạn đang giữ chỗ thành công."
          label="Đăng ký hiện có"
          tone="success"
          value={activeEnrollments.length}
        />
        <StatCard
          description="Tổng tín chỉ hiện tại theo các học phần đang đăng ký."
          label="Tín chỉ"
          tone="primary"
          value={registeredCredits}
        />
      </div>
      <StudentEnrollmentBoard initialEnrolled={enrolledCards} initialOpen={openCards} />
    </div>
  );
}
