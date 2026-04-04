import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { listCourses } from "@/features/courses/queries";
import { listAssignedOfferingsForLecturer } from "@/features/grades/queries";
import { listSchedulesForOfferings } from "@/features/enrollments/queries";
import { listRooms } from "@/features/rooms/queries";
import { weekdayLabel } from "@/lib/format";

export default async function LecturerSchedulePage() {
  const [courses, offerings, rooms] = await Promise.all([
    listCourses(),
    listAssignedOfferingsForLecturer(),
    listRooms(),
  ]);

  const schedules = await listSchedulesForOfferings(offerings.map((offering) => offering.id));
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const offeringMap = new Map(offerings.map((offering) => [offering.id, offering]));
  const roomMap = new Map(rooms.map((room) => [room.id, room]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Lịch giảng dạy được tổng hợp từ các học phần bạn đã được quản trị viên phân công."
        title="Lịch giảng dạy"
      />
      <div className="grid gap-4">
        {schedules.map((schedule) => {
          const offering = offeringMap.get(schedule.course_offering_id);
          const course = offering ? courseMap.get(offering.course_id) : null;
          const room = roomMap.get(schedule.room_id ?? "");

          return (
            <Card key={schedule.id} className="shadow-none">
              <CardHeader>
                <CardTitle>
                  {course?.code} - {course?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {weekdayLabel(schedule.day_of_week)} | {schedule.start_time} - {schedule.end_time} | {room?.code ?? "Chưa gán phòng"}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
