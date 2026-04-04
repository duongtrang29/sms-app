import Link from "next/link";
import { Suspense } from "react";

import { LecturersTable } from "@/components/dashboard/lecturers-table";
import { FormAlert } from "@/components/forms/form-alert";
import { LecturerForm } from "@/components/forms/lecturer-form";
import {
  FormCardSkeleton,
  FormPanelCard,
} from "@/components/forms/form-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { listDepartments } from "@/features/departments/queries";
import { getLecturerById, listLecturers } from "@/features/lecturers/queries";
import { buildReturnPath, getSearchParamString } from "@/lib/admin-routing";
import { mapOptions } from "@/lib/options";

type LecturersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function LecturerEditorCard({
  departments,
  editId,
  returnTo,
}: {
  departments: Awaited<ReturnType<typeof listDepartments>>;
  editId: string | null;
  returnTo: string;
}) {
  const lecturer = editId ? await getLecturerById(editId) : null;

  return (
    <FormPanelCard
      description="Dữ liệu giảng viên sẽ được nạp lại đầy đủ khi bạn đổi bản ghi đang sửa."
      title={lecturer ? "Cập nhật giảng viên" : "Tạo giảng viên mới"}
    >
      <LecturerForm
        departments={departments}
        key={`lecturer-form-${editId ?? "create"}`}
        lecturer={lecturer}
        returnTo={returnTo}
      />
    </FormPanelCard>
  );
}

export default async function LecturersPage({
  searchParams,
}: LecturersPageProps) {
  const resolvedSearchParams = await searchParams;
  const departmentFilter = getSearchParamString(resolvedSearchParams, "department");
  const editId = getSearchParamString(resolvedSearchParams, "edit") || null;
  const error = getSearchParamString(resolvedSearchParams, "error");
  const queryValue = getSearchParamString(resolvedSearchParams, "q");
  const query = queryValue.toLowerCase();
  const statusFilter = getSearchParamString(resolvedSearchParams, "status");
  const success = getSearchParamString(resolvedSearchParams, "success");

  const [departments, lecturers] = await Promise.all([
    listDepartments(),
    listLecturers(),
  ]);

  const departmentMap = new Map(
    departments.map((department) => [department.id, department.name]),
  );
  const allRows = lecturers.map((lecturer) => ({
    departmentId: lecturer.department_id,
    departmentName: departmentMap.get(lecturer.department_id) ?? "Chưa có",
    email: lecturer.email,
    employee_code: lecturer.employee_code,
    full_name: lecturer.full_name,
    id: lecturer.id,
    status: lecturer.status,
  }));

  const rows = allRows.filter((lecturer) => {
    if (
      query &&
      ![
        lecturer.employee_code,
        lecturer.full_name,
        lecturer.email,
        lecturer.departmentName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }

    if (statusFilter && lecturer.status !== statusFilter) {
      return false;
    }

    if (departmentFilter && lecturer.departmentId !== departmentFilter) {
      return false;
    }

    return true;
  });

  const departmentOptions = mapOptions(
    departments,
    (department) => department.name,
  );
  const returnTo = buildReturnPath("/admin/lecturers", [
    ["q", queryValue],
    ["department", departmentFilter],
    ["status", statusFilter],
  ]);

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
        description="Quản trị viên tạo tài khoản giảng viên và gắn về khoa chủ quản để phân công giảng dạy."
        eyebrow="Khu quản trị"
        title="Quản lý giảng viên"
      />
      {error || success ? (
        <FormAlert message={error || success} success={!error} />
      ) : null}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          description="Tổng số giảng viên hiện có trong hệ thống."
          label="Tổng giảng viên"
          tone="primary"
          value={allRows.length}
        />
        <StatCard
          description="Tài khoản giảng viên có thể đăng nhập."
          label="Truy cập khả dụng"
          tone="success"
          value={allRows.filter((row) => row.status === "ACTIVE").length}
        />
        <StatCard
          description="Tài khoản đang bị khóa hoặc tạm ngưng."
          label="Bị hạn chế"
          tone="warning"
          value={allRows.filter((row) => row.status !== "ACTIVE").length}
        />
        <StatCard
          description="Số dòng còn lại sau khi áp bộ lọc."
          label="Dòng đang hiển thị"
          tone="neutral"
          value={rows.length}
        />
      </div>
      <FormPanelCard
        description="Lọc nhanh theo khoa chủ quản, trạng thái tài khoản và từ khóa."
        title="Bộ lọc giảng viên"
      >
        <FilterToolbar
          key={`${queryValue}|${departmentFilter}|${statusFilter}`}
          searchPlaceholder="Tìm mã GV, họ tên, email, khoa"
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
                { label: "Đang hoạt động", value: "ACTIVE" },
                { label: "Tạm ngưng", value: "INACTIVE" },
                { label: "Đã khóa", value: "LOCKED" },
              ],
              placeholder: "Tất cả trạng thái",
            },
          ]}
        />
      </FormPanelCard>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.9fr)]">
        <LecturersTable data={rows} returnTo={returnTo} />
        <Suspense
          fallback={<FormCardSkeleton sections={3} title="Đang tải hồ sơ giảng viên" />}
          key={editId ?? "create"}
        >
          <LecturerEditorCard
            departments={departments}
            editId={editId}
            returnTo={returnTo}
          />
        </Suspense>
      </div>
    </div>
  );
}
