import Link from "next/link";
import { Suspense } from "react";

import { DepartmentsTable } from "@/components/dashboard/departments-table";
import { DepartmentForm } from "@/components/forms/department-form";
import { FormAlert } from "@/components/forms/form-alert";
import {
  FormCardSkeleton,
  FormPanelCard,
} from "@/components/forms/form-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getDepartmentById, listDepartments } from "@/features/departments/queries";
import { buildReturnPath, getSearchParamString } from "@/lib/admin-routing";

type DepartmentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function DepartmentEditorCard({
  editId,
  returnTo,
}: {
  editId: string | null;
  returnTo: string;
}) {
  const department = editId ? await getDepartmentById(editId) : null;

  return (
    <FormPanelCard
      description="Biểu mẫu dùng chung cho cả tạo mới và cập nhật khoa."
      title={department ? "Cập nhật khoa" : "Tạo khoa mới"}
    >
      <DepartmentForm
        key={`department-form-${editId ?? "create"}`}
        department={department}
        returnTo={returnTo}
      />
    </FormPanelCard>
  );
}

export default async function DepartmentsPage({
  searchParams,
}: DepartmentsPageProps) {
  const resolvedSearchParams = await searchParams;
  const editId = getSearchParamString(resolvedSearchParams, "edit") || null;
  const error = getSearchParamString(resolvedSearchParams, "error");
  const queryValue = getSearchParamString(resolvedSearchParams, "q");
  const query = queryValue.toLowerCase();
  const statusFilter = getSearchParamString(resolvedSearchParams, "status");
  const success = getSearchParamString(resolvedSearchParams, "success");
  const departments = await listDepartments();
  const rows = departments.filter((department) => {
    if (
      query &&
      ![department.code, department.name, department.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }

    if (statusFilter) {
      const statusValue = department.is_active ? "ACTIVE" : "INACTIVE";
      if (statusValue !== statusFilter) {
        return false;
      }
    }

    return true;
  });
  const returnTo = buildReturnPath("/admin/departments", [
    ["q", queryValue],
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
        description="Danh mục khoa là tầng gốc cho ngành, lớp và dữ liệu sinh viên."
        title="Quản lý khoa"
      />
      {error || success ? (
        <FormAlert message={error || success} success={!error} />
      ) : null}
      <FormPanelCard
        description="Tìm nhanh theo mã khoa, tên khoa hoặc trạng thái sử dụng."
        title="Bộ lọc khoa"
      >
        <FilterToolbar
          key={`${queryValue}|${statusFilter}`}
          searchPlaceholder="Tìm mã khoa, tên khoa, mô tả"
          searchValue={queryValue}
          selects={[
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
        <DepartmentsTable data={rows} returnTo={returnTo} />
        <Suspense
          fallback={<FormCardSkeleton sections={2} title="Đang tải biểu mẫu khoa" />}
          key={editId ?? "create"}
        >
          <DepartmentEditorCard editId={editId} returnTo={returnTo} />
        </Suspense>
      </div>
    </div>
  );
}
