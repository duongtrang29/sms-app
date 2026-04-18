import Link from "next/link";
import { Suspense } from "react";
import { BookOpenIcon, PlusIcon, Rows3Icon, ShieldCheckIcon } from "lucide-react";
import dynamic from "next/dynamic";

import { CourseForm } from "@/components/forms/course-form";
import { FormAlert } from "@/components/forms/form-alert";
import { FormCardSkeleton } from "@/components/forms/form-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { RoutePanel } from "@/components/shared/route-panel";
import { SectionPanel } from "@/components/shared/section-panel";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { listDepartments } from "@/features/departments/queries";
import { getCourseById, listCoursesSnapshot } from "@/features/courses/queries";
import {
  buildCreatePath,
  buildReturnPath,
  getSearchParamString,
} from "@/lib/admin-routing";
import { mapOptions } from "@/lib/options";

const CoursesTable = dynamic(
  () =>
    import("@/components/dashboard/courses-table").then(
      (module) => module.CoursesTable,
    ),
  {
    loading: () => (
      <div className="app-subtle-surface p-4 text-caption text-muted-foreground">
        Đang tải bảng môn học...
      </div>
    ),
  },
);

type CoursesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const COURSE_STATUS_FILTERS = ["ACTIVE", "INACTIVE"] as const;

async function CourseEditorCard({
  departments,
  editId,
  returnTo,
}: {
  departments: Awaited<ReturnType<typeof listDepartments>>;
  editId: string | null;
  returnTo: string;
}) {
  const course = editId ? await getCourseById(editId) : null;

  return (
    <CourseForm
      course={course}
      key={`course-form-${editId ?? "create"}`}
      departments={departments}
      returnTo={returnTo}
    />
  );
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const resolvedSearchParams = await searchParams;
  const editId = getSearchParamString(resolvedSearchParams, "edit") || null;
  const error = getSearchParamString(resolvedSearchParams, "error");
  const queryValue = getSearchParamString(resolvedSearchParams, "q");
  const departmentFilter = getSearchParamString(resolvedSearchParams, "department");
  const success = getSearchParamString(resolvedSearchParams, "success");
  const statusFilter = getSearchParamString(resolvedSearchParams, "status");
  const mode = getSearchParamString(resolvedSearchParams, "mode");
  const returnTo = buildReturnPath("/admin/courses", [
    ["q", queryValue],
    ["department", departmentFilter],
    ["status", statusFilter],
  ]);
  const isCreateOpen = mode === "create";
  const isEditorOpen = isCreateOpen || Boolean(editId);
  const normalizedStatusFilter = COURSE_STATUS_FILTERS.includes(
    statusFilter as (typeof COURSE_STATUS_FILTERS)[number],
  )
    ? (statusFilter as (typeof COURSE_STATUS_FILTERS)[number])
    : undefined;
  const courseFilters = {
    limit: 500,
    ...(departmentFilter ? { departmentId: departmentFilter } : {}),
    ...(queryValue ? { query: queryValue } : {}),
    ...(normalizedStatusFilter ? { status: normalizedStatusFilter } : {}),
  };

  const [departments, coursesSnapshot] = await Promise.all([
    listDepartments(),
    listCoursesSnapshot(courseFilters),
  ]);

  const departmentMap = new Map(
    departments.map((department) => [department.id, department.name]),
  );
  const rows = coursesSnapshot.items.map((course) => ({
    code: course.code,
    credit_hours: course.credit_hours,
    departmentId: course.department_id,
    departmentName: departmentMap.get(course.department_id) ?? "Chưa có",
    id: course.id,
    is_active: course.is_active,
    name: course.name,
  }));

  const departmentOptions = mapOptions(
    departments,
    (department) => department.name,
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
        description="Danh mục môn học gốc."
        icon={<BookOpenIcon className="size-5" />}
        info="Quản lý môn học gốc để mở nhiều học phần theo từng học kỳ."
        title="Môn học"
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          description="Tổng danh mục môn học hiện có."
          icon={<BookOpenIcon className="size-4" />}
          label="Tổng môn học"
          tone="primary"
          value={coursesSnapshot.summary.totalCourses}
        />
        <StatCard
          description="Môn học đang còn hiệu lực để mở học phần."
          icon={<ShieldCheckIcon className="size-4" />}
          label="Đang hiệu lực"
          tone="success"
          value={coursesSnapshot.summary.activeCourses}
        />
        <StatCard
          description="Số tín chỉ trung bình trên danh mục đang hiển thị."
          icon={<Rows3Icon className="size-4" />}
          label="Tín chỉ trung bình"
          tone="info"
          value={
            rows.length
              ? (rows.reduce((sum, row) => sum + row.credit_hours, 0) / rows.length).toFixed(1)
              : "0.0"
          }
        />
        <StatCard
          description="Số dòng còn lại sau khi áp bộ lọc."
          label="Dòng đang hiển thị"
          tone="neutral"
          value={rows.length}
        />
      </div>
      {error || success ? (
        <FormAlert message={error || success} success={!error} />
      ) : null}
      <SectionPanel>
        <FilterToolbar
          key={`${queryValue}|${departmentFilter}|${statusFilter}`}
          resultCount={rows.length}
          searchPlaceholder="Tìm mã môn, tên môn, khoa"
          searchValue={queryValue}
          selects={[
            {
              key: "department",
              label: "Khoa",
              options: departmentOptions,
              placeholder: "Tất cả khoa",
            },
            {
              key: "status",
              label: "Trạng thái",
              options: [
                { label: "Hoạt động", value: "ACTIVE" },
                { label: "Tạm ngưng", value: "INACTIVE" },
              ],
              placeholder: "Tất cả trạng thái",
            },
          ]}
        />
      </SectionPanel>
      <CoursesTable data={rows} returnTo={returnTo} />
      <RoutePanel
        badge={editId ? "Chỉnh sửa" : "Thêm mới"}
        closeHref={returnTo}
        description="Quản lý thông tin môn học, tín chỉ và khoa phụ trách."
        icon={<BookOpenIcon className="size-5" />}
        open={isEditorOpen}
        size="xl"
        title={editId ? "Cập nhật môn học" : "Thêm môn học"}
        variant="dialog"
      >
        <Suspense
          fallback={<FormCardSkeleton sections={3} title="Đang tải biểu mẫu môn học" />}
          key={editId ?? "create"}
        >
          <CourseEditorCard
            departments={departments}
            editId={editId}
            returnTo={returnTo}
          />
        </Suspense>
      </RoutePanel>
    </div>
  );
}
