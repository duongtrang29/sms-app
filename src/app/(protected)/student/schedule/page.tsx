import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { listCourses } from "@/features/courses/queries";
import { listCourseOfferings } from "@/features/course-offerings/queries";
import { listSchedulesForOfferings, listStudentEnrollments } from "@/features/enrollments/queries";
import { listRooms } from "@/features/rooms/queries";
import { weekPatternLabel, weekdayLabel } from "@/lib/format";

export default async function StudentSchedulePage() {
  const [courses, enrollments, offerings, rooms] = await Promise.all([
    listCourses(),
    listStudentEnrollments(),
    listCourseOfferings(),
    listRooms(),
  ]);

  const activeOfferingIds = enrollments
    .filter((enrollment) => enrollment.status === "ENROLLED")
    .map((enrollment) => enrollment.course_offering_id);
  const schedules = await listSchedulesForOfferings(activeOfferingIds);
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const offeringMap = new Map(offerings.map((offering) => [offering.id, offering]));
  const roomMap = new Map(rooms.map((room) => [room.id, room]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Lịch học cá nhân được ghép từ các học phần bạn đang đăng ký."
        title="Thời khóa biểu cá nhân"
      />
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Lịch học hiện tại</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {schedules.map((schedule) => {
            const offering = offeringMap.get(schedule.course_offering_id);
            const course = offering ? courseMap.get(offering.course_id) : null;
            const room = roomMap.get(schedule.room_id ?? "");

            return (
              <div
                key={schedule.id}
                className="rounded-xl border border-border p-4"
              >
                <div className="font-medium">
                  {course?.code} - {course?.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {weekdayLabel(schedule.day_of_week)} | {schedule.start_time} - {schedule.end_time}
                </div>
                <div className="text-sm text-muted-foreground">
                  {room?.code ?? "Chưa gán phòng"} | {weekPatternLabel(schedule.week_pattern)}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
