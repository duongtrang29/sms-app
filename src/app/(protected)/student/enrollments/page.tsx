import { FormAlert } from "@/components/forms/form-alert";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCoursesByIds } from "@/features/courses/queries";
import {
  listCourseOfferingsByIds,
  listPrimaryTeachingAssignmentsForOfferings,
} from "@/features/course-offerings/queries";
import {
  cancelEnrollmentFormAction,
  registerEnrollmentFormAction,
} from "@/features/enrollments/actions";
import {
  listOpenOfferingsForStudent,
  listSchedulesForOfferings,
  listStudentEnrollments,
} from "@/features/enrollments/queries";
import { listLecturersByIds } from "@/features/lecturers/queries";
import { listSemestersByIds } from "@/features/semesters/queries";
import { formatDateTime, weekdayLabel } from "@/lib/format";

type StudentEnrollmentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StudentEnrollmentsPage({
  searchParams,
}: StudentEnrollmentsPageProps) {
  const resolvedSearchParams = await searchParams;
  const returnToQuery =
    typeof resolvedSearchParams.return_to === "string"
      ? resolvedSearchParams.return_to
      : undefined;
  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : undefined;
  const success =
    typeof resolvedSearchParams.success === "string"
      ? resolvedSearchParams.success
      : undefined;
  const returnToPath =
    returnToQuery &&
    (returnToQuery.startsWith("/student/enrollments") ||
      returnToQuery.startsWith("/student/enrollment"))
      ? returnToQuery
      : "/student/enrollments";

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

  const scheduleMap = new Map<string, string>();
  schedules.forEach((schedule) => {
    const entry = `${weekdayLabel(schedule.day_of_week)} ${schedule.start_time}-${schedule.end_time}`;
    const existing = scheduleMap.get(schedule.course_offering_id);
    scheduleMap.set(
      schedule.course_offering_id,
      existing ? `${existing}; ${entry}` : entry,
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Danh sách học phần đang mở và các học phần bạn đã đăng ký. Mọi kiểm tra trùng lịch, tín chỉ, tiên quyết và sĩ số đều chạy ở phía máy chủ."
        eyebrow="Khu sinh viên"
        title="Đăng ký học phần"
      />
      {error ? <FormAlert message={error} /> : null}
      {success ? <FormAlert message={success} success /> : null}
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
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Học phần đang mở</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {openOfferings.length ? (
              openOfferings.map((offering) => {
                const course = courseMap.get(offering.course_id);
                const semester = semesterMap.get(offering.semester_id);
                const lecturer = lecturerMap.get(
                  assignmentMap.get(offering.id) ?? "",
                );

                return (
                  <div
                    key={offering.id}
                    className="app-subtle-surface flex flex-col gap-4 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold tracking-tight text-foreground">
                          {course?.code} - {course?.name}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {semester?.code} | Nhóm {offering.section_code} |{" "}
                          {lecturer?.full_name ?? "Chưa gán giảng viên"}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge value={offering.status} />
                        {enrolledOfferingIds.has(offering.id) ? (
                          <StatusBadge value="ENROLLED" />
                        ) : null}
                      </div>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground">
                      <div>
                        {scheduleMap.get(offering.id) ?? "Chưa có lịch học"}
                      </div>
                      <div>
                        Mở đăng ký: {formatDateTime(offering.registration_open_at)} |
                        Đóng đăng ký:{" "}
                        {formatDateTime(offering.registration_close_at)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/85 px-3 py-1.5 text-sm text-muted-foreground">
                        <span className="app-status-dot bg-[color:var(--color-info)]" />
                        Còn {offering.max_capacity - offering.enrolled_count}/
                        {offering.max_capacity} chỗ
                      </div>
                      {enrolledOfferingIds.has(offering.id) ? (
                        <span className="text-sm font-medium text-[color:var(--color-success-foreground)]">
                          Đã giữ chỗ
                        </span>
                      ) : (
                        <form action={registerEnrollmentFormAction}>
                          <input
                            name="offering_id"
                            type="hidden"
                            value={offering.id}
                          />
                          <input
                            name="return_to"
                            type="hidden"
                            value={returnToPath}
                          />
                          <Button type="submit">Đăng ký</Button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                description="Hiện chưa có học phần nào ở trạng thái mở để bạn đăng ký."
                title="Không có học phần mở"
              />
            )}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Học phần của tôi</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {enrollments.length ? (
              enrollments.map((enrollment) => {
                const offering = offeringMap.get(enrollment.course_offering_id);
                const course = offering ? courseMap.get(offering.course_id) : null;

                return (
                  <div
                    key={enrollment.id}
                    className="app-subtle-surface flex flex-col gap-4 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold tracking-tight text-foreground">
                          {course?.code ?? "Chưa có"} - {course?.name ?? "Chưa có"}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {scheduleMap.get(enrollment.course_offering_id) ??
                            "Chưa có lịch học"}
                        </div>
                      </div>
                      <StatusBadge value={enrollment.status} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-muted-foreground">
                        {offering
                          ? `Nhóm ${offering.section_code}`
                          : "Không có dữ liệu học phần"}
                      </div>
                      {enrollment.status === "ENROLLED" ? (
                        <form action={cancelEnrollmentFormAction}>
                          <input
                            name="enrollment_id"
                            type="hidden"
                            value={enrollment.id}
                          />
                          <input
                            name="return_to"
                            type="hidden"
                            value={returnToPath}
                          />
                          <Button type="submit" variant="outline">
                            Hủy đăng ký
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                description="Bạn chưa đăng ký học phần nào trong dữ liệu hiện tại."
                title="Chưa có học phần đã đăng ký"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
