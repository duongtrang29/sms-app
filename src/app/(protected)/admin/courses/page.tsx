import Link from "next/link";
import { Suspense } from "react";

import { CoursesTable } from "@/components/dashboard/courses-table";
import { CourseForm } from "@/components/forms/course-form";
import { FormAlert } from "@/components/forms/form-alert";
import {
  FormCardSkeleton,
  FormPanelCard,
} from "@/components/forms/form-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { listDepartments } from "@/features/departments/queries";
import { getCourseById, listCourses } from "@/features/courses/queries";
import { buildReturnPath, getSearchParamString } from "@/lib/admin-routing";
import { mapOptions } from "@/lib/options";

type CoursesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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
    <FormPanelCard
      description="Biểu mẫu môn học tự động điền sẵn đầy đủ khi sửa và giữ nguyên bố cục với các biểu mẫu còn lại."
      title={course ? "Cập nhật môn học" : "Tạo môn học mới"}
    >
      <CourseForm
        course={course}
        key={`course-form-${editId ?? "create"}`}
        departments={departments}
        returnTo={returnTo}
      />
    </FormPanelCard>
  );
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const resolvedSearchParams = await searchParams;
  const editId = getSearchParamString(resolvedSearchParams, "edit") || null;
  const error = getSearchParamString(resolvedSearchParams, "error");
  const queryValue = getSearchParamString(resolvedSearchParams, "q");
  const query = queryValue.toLowerCase();
  const departmentFilter = getSearchParamString(resolvedSearchParams, "department");
  const success = getSearchParamString(resolvedSearchParams, "success");
  const statusFilter = getSearchParamString(resolvedSearchParams, "status");
  const returnTo = buildReturnPath("/admin/courses", [
    ["q", queryValue],
    ["department", departmentFilter],
    ["status", statusFilter],
  ]);

  const [departments, courses] = await Promise.all([
    listDepartments(),
    listCourses(),
  ]);

  const departmentMap = new Map(
    departments.map((department) => [department.id, department.name]),
  );
  const allRows = courses.map((course) => ({
    code: course.code,
    credit_hours: course.credit_hours,
    departmentId: course.department_id,
    departmentName: departmentMap.get(course.department_id) ?? "Chưa có",
    id: course.id,
    is_active: course.is_active,
    name: course.name,
  }));

  const rows = allRows.filter((course) => {
    if (
      query &&
      ![course.code, course.name, course.departmentName]
        .join(" ")
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }

    if (departmentFilter && course.departmentId !== departmentFilter) {
      return false;
    }

    if (statusFilter) {
      const statusValue = course.is_active ? "ACTIVE" : "INACTIVE";
      if (statusValue !== statusFilter) {
        return false;
      }
    }

    return true;
  });

  const departmentOptions = mapOptions(
    departments,
    (department) => department.name,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          editId ? (
            <Link href={returnTo}>
              <Button type="button" variant="outline">
                Tạo mới
              </Button>
            </Link>
          ) : null
        }
        description="Quản lý môn học gốc để mở nhiều học phần theo từng học kỳ."
        eyebrow="Khu quản trị"
        title="Quản lý môn học"
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          description="Tổng danh mục môn học hiện có."
          label="Tổng môn học"
          tone="primary"
          value={allRows.length}
        />
        <StatCard
          description="Môn học đang còn hiệu lực để mở học phần."
          label="Đang hiệu lực"
          tone="success"
          value={allRows.filter((row) => row.is_active).length}
        />
        <StatCard
          description="Số tín chỉ trung bình trên danh mục đang hiển thị."
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
      <FormPanelCard
        description="Lọc theo khoa, trạng thái và từ khóa. Đường dẫn trang luôn phản ánh đúng bộ lọc hiện tại."
        title="Bộ lọc môn học"
      >
        <FilterToolbar
          key={`${queryValue}|${departmentFilter}|${statusFilter}`}
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
      </FormPanelCard>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.9fr)]">
        <CoursesTable data={rows} returnTo={returnTo} />
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
      </div>
    </div>
  );
}
