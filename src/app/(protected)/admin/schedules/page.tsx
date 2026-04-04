import Link from "next/link";
import { Suspense } from "react";

import { SchedulesTable } from "@/components/dashboard/schedules-table";
import { ScheduleForm } from "@/components/forms/schedule-form";
import {
  FormCardSkeleton,
  FormPanelCard,
} from "@/components/forms/form-container";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { listCourses } from "@/features/courses/queries";
import { listCourseOfferings } from "@/features/course-offerings/queries";
import { listRooms } from "@/features/rooms/queries";
import { getScheduleById, listSchedules } from "@/features/schedules/queries";
import { listSemesters } from "@/features/semesters/queries";
import { mapOptions } from "@/lib/options";
import type { SelectOption } from "@/types/forms";

type SchedulesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function ScheduleEditorCard({
  courseOfferingOptions,
  editId,
  roomOptions,
}: {
  courseOfferingOptions: SelectOption[];
  editId: string | null;
  roomOptions: SelectOption[];
}) {
  const schedule = editId ? await getScheduleById(editId) : null;

  return (
    <FormPanelCard
        description="Lịch học sẽ tự động nạp lại theo học phần và phòng học hiện tại khi chuyển chế độ sửa."
      title={schedule ? "Cập nhật lịch học" : "Tạo lịch học mới"}
    >
      <ScheduleForm
        courseOfferingOptions={courseOfferingOptions}
        key={`schedule-form-${editId ?? "create"}`}
        roomOptions={roomOptions}
        schedule={schedule}
      />
    </FormPanelCard>
  );
}

export default async function SchedulesPage({ searchParams }: SchedulesPageProps) {
  const resolvedSearchParams = await searchParams;
  const editId =
    typeof resolvedSearchParams.edit === "string"
      ? resolvedSearchParams.edit
      : null;

  const [courseOfferings, courses, rooms, schedules, semesters] = await Promise.all([
    listCourseOfferings(),
    listCourses(),
    listRooms(),
    listSchedules(),
    listSemesters(),
  ]);

  const courseMap = new Map(
    courses.map((course) => [course.id, `${course.code} - ${course.name}`]),
  );
  const semesterMap = new Map(
    semesters.map((semester) => [semester.id, semester.code]),
  );
  const offeringMap = new Map(
    courseOfferings.map((offering) => [
      offering.id,
      `${courseMap.get(offering.course_id) ?? "Chưa có"} - Nhóm ${offering.section_code} - ${
        semesterMap.get(offering.semester_id) ?? "Chưa có"
      }`,
    ]),
  );
  const roomMap = new Map(
    rooms.map((room) => [room.id, `${room.code} - ${room.name}`]),
  );

  const rows = schedules.map((schedule) => ({
    day_of_week: schedule.day_of_week,
    id: schedule.id,
    offeringName: offeringMap.get(schedule.course_offering_id) ?? "Chưa có",
    roomName: roomMap.get(schedule.room_id ?? "") ?? "Chưa gán",
    timeRange: `${schedule.start_time} - ${schedule.end_time}`,
  }));

  const courseOfferingOptions = mapOptions(
    courseOfferings,
    (offering) =>
      `${courseMap.get(offering.course_id) ?? "Chưa có"} - Nhóm ${offering.section_code} - ${
        semesterMap.get(offering.semester_id) ?? "Chưa có"
      }`,
  );
  const roomOptions = mapOptions(
    rooms,
    (room) => `${room.code} - ${room.name}`,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          editId ? (
            <Link href="/admin/schedules">
              <Button type="button" variant="outline">
                Tạo mới
              </Button>
            </Link>
          ) : null
        }
        description="Lịch học gắn với học phần mở và phòng học, đồng thời dùng để kiểm tra trùng lịch khi đăng ký."
        title="Quản lý lịch học"
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.95fr)]">
        <SchedulesTable data={rows} />
        <Suspense
          fallback={<FormCardSkeleton sections={3} title="Đang tải biểu mẫu lịch học" />}
          key={editId ?? "create"}
        >
          <ScheduleEditorCard
            courseOfferingOptions={courseOfferingOptions}
            editId={editId}
            roomOptions={roomOptions}
          />
        </Suspense>
      </div>
    </div>
  );
}
