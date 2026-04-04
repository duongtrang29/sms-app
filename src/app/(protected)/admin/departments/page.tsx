import Link from "next/link";
import { Suspense } from "react";
import { Building2Icon, PlusIcon } from "lucide-react";

import { DepartmentsTable } from "@/components/dashboard/departments-table";
import { DepartmentForm } from "@/components/forms/department-form";
import { FormAlert } from "@/components/forms/form-alert";
import { FormCardSkeleton } from "@/components/forms/form-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { RoutePanel } from "@/components/shared/route-panel";
import { SectionPanel } from "@/components/shared/section-panel";
import { Button } from "@/components/ui/button";
import { getDepartmentById, listDepartments } from "@/features/departments/queries";
import {
  buildCreatePath,
  buildReturnPath,
  getSearchParamString,
} from "@/lib/admin-routing";

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
    <DepartmentForm
      key={`department-form-${editId ?? "create"}`}
      department={department}
      returnTo={returnTo}
    />
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
  const mode = getSearchParamString(resolvedSearchParams, "mode");
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
  const isCreateOpen = mode === "create";
  const isEditorOpen = isCreateOpen || Boolean(editId);

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
        description="Danh mục đơn vị đào tạo."
        icon={<Building2Icon className="size-5" />}
        info="Khoa là tầng gốc cho ngành, lớp và dữ liệu sinh viên."
        title="Khoa"
      />
      {error || success ? (
        <FormAlert message={error || success} success={!error} />
      ) : null}
      <SectionPanel>
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
      </SectionPanel>
      <DepartmentsTable data={rows} returnTo={returnTo} />
      <RoutePanel
        badge={editId ? "Chỉnh sửa" : "Thêm mới"}
        closeHref={returnTo}
        description="Quản lý mã khoa, tên khoa và trạng thái sử dụng."
        icon={<Building2Icon className="size-5" />}
        open={isEditorOpen}
        title={editId ? "Cập nhật khoa" : "Thêm khoa"}
        variant="dialog"
      >
        <Suspense
          fallback={<FormCardSkeleton sections={2} title="Đang tải biểu mẫu khoa" />}
          key={editId ?? "create"}
        >
          <DepartmentEditorCard editId={editId} returnTo={returnTo} />
        </Suspense>
      </RoutePanel>
    </div>
  );
}
