import Link from "next/link";
import { Suspense } from "react";
import { CalendarDaysIcon, PlusIcon } from "lucide-react";

import { SchedulesTable } from "@/components/dashboard/schedules-table";
import { ScheduleForm } from "@/components/forms/schedule-form";
import { FormCardSkeleton } from "@/components/forms/form-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { RoutePanel } from "@/components/shared/route-panel";
import { SectionPanel } from "@/components/shared/section-panel";
import { Button } from "@/components/ui/button";
import { listCourses } from "@/features/courses/queries";
import { listCourseOfferings } from "@/features/course-offerings/queries";
import { listRooms } from "@/features/rooms/queries";
import { getScheduleById, listSchedules } from "@/features/schedules/queries";
import { listSemesters } from "@/features/semesters/queries";
import {
  buildCreatePath,
  buildReturnPath,
  getSearchParamString,
} from "@/lib/admin-routing";
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
    <ScheduleForm
      courseOfferingOptions={courseOfferingOptions}
      key={`schedule-form-${editId ?? "create"}`}
      roomOptions={roomOptions}
      schedule={schedule}
    />
  );
}

export default async function SchedulesPage({ searchParams }: SchedulesPageProps) {
  const resolvedSearchParams = await searchParams;
  const editId = getSearchParamString(resolvedSearchParams, "edit") || null;
  const mode = getSearchParamString(resolvedSearchParams, "mode");
  const queryValue = getSearchParamString(resolvedSearchParams, "q");
  const query = queryValue.toLowerCase();
  const returnTo = buildReturnPath("/admin/schedules", [["q", queryValue]]);
  const isCreateOpen = mode === "create";
  const isEditorOpen = isCreateOpen || Boolean(editId);

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

  const rows = schedules
    .map((schedule) => ({
      day_of_week: schedule.day_of_week,
      id: schedule.id,
      offeringName: offeringMap.get(schedule.course_offering_id) ?? "Chưa có",
      roomName: roomMap.get(schedule.room_id ?? "") ?? "Chưa gán",
      timeRange: `${schedule.start_time} - ${schedule.end_time}`,
    }))
    .filter((schedule) =>
      query
        ? [schedule.offeringName, schedule.roomName, schedule.timeRange]
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true,
    );

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
          <Link href={buildCreatePath(returnTo)}>
            <Button type="button">
              <PlusIcon data-icon="inline-start" />
              Thêm mới
            </Button>
          </Link>
        }
        description="Thời khóa biểu theo học phần."
        icon={<CalendarDaysIcon className="size-5" />}
        info="Lịch học gắn với học phần mở và phòng học, đồng thời dùng để kiểm tra trùng lịch khi đăng ký."
        title="Lịch học"
      />
      <SectionPanel>
        <FilterToolbar
          key={queryValue}
          resultCount={rows.length}
          searchPlaceholder="Tìm học phần, phòng học, thời gian"
          searchValue={queryValue}
        />
      </SectionPanel>
      <SchedulesTable data={rows} />
      <RoutePanel
        badge={editId ? "Chỉnh sửa" : "Thêm mới"}
        closeHref={returnTo}
        description="Quản lý học phần, phòng học và khung giờ để tránh xung đột lịch."
        icon={<CalendarDaysIcon className="size-5" />}
        open={isEditorOpen}
        title={editId ? "Cập nhật lịch học" : "Thêm lịch học"}
        variant="drawer"
      >
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
      </RoutePanel>
    </div>
  );
}
