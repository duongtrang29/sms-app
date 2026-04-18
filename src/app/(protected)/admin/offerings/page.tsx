import Link from "next/link";
import { Suspense } from "react";
import {
  BookOpenIcon,
  ClipboardListIcon,
  PlusIcon,
  Rows3Icon,
} from "lucide-react";
import dynamic from "next/dynamic";

import { CourseOfferingForm } from "@/components/forms/course-offering-form";
import { FormAlert } from "@/components/forms/form-alert";
import { FormCardSkeleton } from "@/components/forms/form-container";
import { QueryToast } from "@/components/shared/query-toast";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { RoutePanel } from "@/components/shared/route-panel";
import { SectionPanel } from "@/components/shared/section-panel";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  closeOfferingEnrollmentFormAction,
  openOfferingEnrollmentFormAction,
} from "@/features/course-offerings/actions";
import { listCourses } from "@/features/courses/queries";
import {
  getCourseOfferingById,
  listAdminCourseOfferingSnapshot,
  listPrimaryTeachingAssignmentsForOfferings,
} from "@/features/course-offerings/queries";
import { listLecturers } from "@/features/lecturers/queries";
import { listSemesters } from "@/features/semesters/queries";
import {
  buildCreatePath,
  buildReturnPath,
  getSearchParamString,
} from "@/lib/admin-routing";
import { mapOptions } from "@/lib/options";
import type { SelectOption } from "@/types/forms";

const CourseOfferingsTable = dynamic(
  () =>
    import("@/components/dashboard/course-offerings-table").then(
      (module) => module.CourseOfferingsTable,
    ),
  {
    loading: () => (
      <div className="app-subtle-surface p-4 text-caption text-muted-foreground">
        Đang tải bảng học phần mở...
      </div>
    ),
  },
);

type OfferingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const OFFERING_STATUS_FILTERS = [
  "DRAFT",
  "OPEN",
  "CLOSED",
  "FINISHED",
  "CANCELLED",
] as const;

async function CourseOfferingEditorCard({
  courseOptions,
  editId,
  lecturerOptions,
  returnTo,
  semesterOptions,
}: {
  courseOptions: SelectOption[];
  editId: string | null;
  lecturerOptions: SelectOption[];
  returnTo: string;
  semesterOptions: SelectOption[];
}) {
  const offering = editId ? await getCourseOfferingById(editId) : null;

  return (
    <CourseOfferingForm
      courseOptions={courseOptions}
      key={`offering-form-${editId ?? "create"}`}
      lecturerOptions={lecturerOptions}
      offering={offering}
      returnTo={returnTo}
      semesterOptions={semesterOptions}
    />
  );
}

export default async function OfferingsPage({ searchParams }: OfferingsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="app-subtle-surface p-6 text-caption text-muted-foreground">
          Đang tải học phần mở...
        </div>
      }
    >
      <OfferingsPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function OfferingsPageContent({ searchParams }: OfferingsPageProps) {
  const resolvedSearchParams = await searchParams;
  const editId = getSearchParamString(resolvedSearchParams, "edit") || null;
  const error = getSearchParamString(resolvedSearchParams, "error");
  const queryValue = getSearchParamString(resolvedSearchParams, "q");
  const query = queryValue.trim().toLowerCase();
  const semesterFilter = getSearchParamString(resolvedSearchParams, "semester");
  const success = getSearchParamString(resolvedSearchParams, "success");
  const statusFilter = getSearchParamString(resolvedSearchParams, "status");
  const mode = getSearchParamString(resolvedSearchParams, "mode");
  const returnTo = buildReturnPath("/admin/offerings", [
    ["q", queryValue],
    ["semester", semesterFilter],
    ["status", statusFilter],
  ]);
  const isCreateOpen = mode === "create";
  const isEditorOpen = isCreateOpen || Boolean(editId);
  const normalizedStatusFilter = OFFERING_STATUS_FILTERS.includes(
    statusFilter as (typeof OFFERING_STATUS_FILTERS)[number],
  )
    ? (statusFilter as (typeof OFFERING_STATUS_FILTERS)[number])
    : undefined;
  const offeringFilters = {
    limit: 500,
    ...(semesterFilter ? { semesterId: semesterFilter } : {}),
    ...(normalizedStatusFilter ? { status: normalizedStatusFilter } : {}),
  };

  const [courses, offeringsSnapshot, lecturers, semesters] =
    await Promise.all([
      listCourses(),
      listAdminCourseOfferingSnapshot(offeringFilters),
      listLecturers(),
      listSemesters(),
    ]);
  const primaryAssignments = await listPrimaryTeachingAssignmentsForOfferings(
    offeringsSnapshot.items.map((offering) => offering.id),
  );

  const courseMap = new Map(
    courses.map((course) => [course.id, `${course.code} - ${course.name}`]),
  );
  const lecturerMap = new Map(
    lecturers.map((lecturer) => [
      lecturer.id,
      `${lecturer.employee_code} - ${lecturer.full_name}`,
    ]),
  );
  const semesterMap = new Map(
    semesters.map((semester) => [
      semester.id,
      `${semester.code} - ${semester.name}`,
    ]),
  );
  const assignmentMap = new Map(
    primaryAssignments.map((assignment) => [
      assignment.course_offering_id,
      assignment.lecturer_id,
    ]),
  );

  const allRows = offeringsSnapshot.items.map((offering) => ({
    courseName: courseMap.get(offering.course_id) ?? "Chưa có",
    enrollment: `${offering.enrolled_count}/${offering.max_capacity}`,
    id: offering.id,
    lecturerName:
      lecturerMap.get(assignmentMap.get(offering.id) ?? "") ?? "Chưa gán",
    section_code: offering.section_code,
    semesterId: offering.semester_id,
    semesterName: semesterMap.get(offering.semester_id) ?? "Chưa có",
    status: offering.status,
  }));

  const rows = allRows.filter((offering) => {
    if (
      query.length > 0 &&
      ![
        offering.courseName,
        offering.lecturerName,
        offering.section_code,
        offering.semesterName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }
    return true;
  });

  const courseOptions = mapOptions(
    courses,
    (course) => `${course.code} - ${course.name}`,
  );
  const lecturerOptions = mapOptions(
    lecturers,
    (lecturer) => `${lecturer.employee_code} - ${lecturer.full_name}`,
  );
  const semesterOptions = mapOptions(
    semesters,
    (semester) => `${semester.code} - ${semester.name}`,
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
        description="Danh sách học phần mở theo học kỳ."
        icon={<ClipboardListIcon className="size-5" />}
        info="Mỗi học phần mở thuộc một môn học và một học kỳ, có giảng viên chính và quy tắc đăng ký riêng."
        title="Học phần mở"
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          description="Tổng số học phần đã cấu hình trong hệ thống."
          icon={<ClipboardListIcon className="size-4" />}
          label="Tổng học phần mở"
          tone="primary"
          value={offeringsSnapshot.summary.totalOfferings}
        />
        <StatCard
          description="Học phần hiện còn đang mở cho sinh viên đăng ký."
          icon={<BookOpenIcon className="size-4" />}
          label="Đang mở"
          tone="info"
          value={offeringsSnapshot.summary.openOfferings}
        />
        <StatCard
          description="Học phần đã hoàn tất hoặc đóng đăng ký."
          icon={<Rows3Icon className="size-4" />}
          label="Đã đóng / kết thúc"
          tone="neutral"
          value={offeringsSnapshot.summary.closedOrFinishedOfferings}
        />
        <StatCard
          description="Số dòng còn lại theo bộ lọc hiện tại."
          label="Dòng đang hiển thị"
          tone="success"
          value={rows.length}
        />
      </div>
      {error || success ? (
        <FormAlert message={error || success} success={!error} />
      ) : null}
      <QueryToast
        error={error}
        success={success}
      />
      <SectionPanel>
        <FilterToolbar
          key={`${queryValue}|${semesterFilter}|${statusFilter}`}
          resultCount={rows.length}
          searchPlaceholder="Tìm môn học, giảng viên, nhóm, học kỳ"
          searchValue={queryValue}
          selects={[
            {
              key: "semester",
              label: "Học kỳ",
              options: semesterOptions,
              placeholder: "Tất cả học kỳ",
            },
            {
              key: "status",
              label: "Trạng thái",
              options: [
                { label: "Nháp", value: "DRAFT" },
                { label: "Mở đăng ký", value: "OPEN" },
                { label: "Đã đóng", value: "CLOSED" },
                { label: "Kết thúc", value: "FINISHED" },
                { label: "Đã hủy", value: "CANCELLED" },
              ],
              placeholder: "Tất cả trạng thái",
            },
          ]}
        />
      </SectionPanel>
      <SectionPanel
        description="Thao tác nhanh trạng thái mở/đóng đăng ký cho từng học phần."
        title="Card học phần mở"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <div
              key={`offering-card-${row.id}`}
              className="app-subtle-surface flex flex-col gap-4 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold tracking-tight text-foreground">
                    {row.courseName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {row.semesterName} | Nhóm {row.section_code}
                  </div>
                </div>
                <StatusBadge value={row.status} />
              </div>
              <div className="text-sm text-muted-foreground">
                Giảng viên: {row.lecturerName}
              </div>
              <div className="text-sm text-muted-foreground">
                Đăng ký: {row.enrollment}
              </div>
              <div className="flex flex-wrap gap-2">
                {row.status !== "OPEN" ? (
                  <form action={openOfferingEnrollmentFormAction}>
                    <input name="offering_id" type="hidden" value={row.id} />
                    <input name="return_to" type="hidden" value={returnTo} />
                    <Button size="sm" type="submit">
                      Mở đăng ký
                    </Button>
                  </form>
                ) : null}
                {row.status === "OPEN" ? (
                  <form action={closeOfferingEnrollmentFormAction}>
                    <input name="offering_id" type="hidden" value={row.id} />
                    <input name="return_to" type="hidden" value={returnTo} />
                    <Button size="sm" type="submit" variant="outline">
                      Đóng đăng ký
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </SectionPanel>
      <CourseOfferingsTable data={rows} returnTo={returnTo} />
      <RoutePanel
        badge={editId ? "Chỉnh sửa" : "Thêm mới"}
        closeHref={returnTo}
        description="Quản lý môn học, học kỳ, giảng viên chính và sức chứa theo học phần."
        icon={<ClipboardListIcon className="size-5" />}
        open={isEditorOpen}
        title={editId ? "Cập nhật học phần mở" : "Mở học phần"}
        variant="drawer"
      >
        <Suspense
          fallback={<FormCardSkeleton sections={3} title="Đang tải học phần mở" />}
          key={editId ?? "create"}
        >
          <CourseOfferingEditorCard
            courseOptions={courseOptions}
            editId={editId}
            lecturerOptions={lecturerOptions}
            returnTo={returnTo}
            semesterOptions={semesterOptions}
          />
        </Suspense>
      </RoutePanel>
    </div>
  );
}
