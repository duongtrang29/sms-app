import Link from "next/link";
import { Suspense } from "react";

import { MajorsTable } from "@/components/dashboard/majors-table";
import { FormAlert } from "@/components/forms/form-alert";
import { MajorForm } from "@/components/forms/major-form";
import {
  FormCardSkeleton,
  FormPanelCard,
} from "@/components/forms/form-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { listDepartments } from "@/features/departments/queries";
import { getMajorById, listMajors } from "@/features/majors/queries";
import { buildReturnPath, getSearchParamString } from "@/lib/admin-routing";
import { mapOptions } from "@/lib/options";

type MajorsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function MajorEditorCard({
  departments,
  editId,
  returnTo,
}: {
  departments: Awaited<ReturnType<typeof listDepartments>>;
  editId: string | null;
  returnTo: string;
}) {
  const major = editId ? await getMajorById(editId) : null;

  return (
    <FormPanelCard
      description="Biểu mẫu ngành dùng chung cho tạo mới và cập nhật."
      title={major ? "Cập nhật ngành" : "Tạo ngành mới"}
    >
      <MajorForm
        key={`major-form-${editId ?? "create"}`}
        departments={departments}
        major={major}
        returnTo={returnTo}
      />
    </FormPanelCard>
  );
}

export default async function MajorsPage({ searchParams }: MajorsPageProps) {
  const resolvedSearchParams = await searchParams;
  const departmentFilter = getSearchParamString(resolvedSearchParams, "department");
  const editId = getSearchParamString(resolvedSearchParams, "edit") || null;
  const error = getSearchParamString(resolvedSearchParams, "error");
  const queryValue = getSearchParamString(resolvedSearchParams, "q");
  const query = queryValue.toLowerCase();
  const statusFilter = getSearchParamString(resolvedSearchParams, "status");
  const success = getSearchParamString(resolvedSearchParams, "success");

  const [departments, majors] = await Promise.all([
    listDepartments(),
    listMajors(),
  ]);

  const departmentMap = new Map(
    departments.map((department) => [department.id, department.name]),
  );
  const rows = majors.map((major) => ({
    code: major.code,
    departmentId: major.department_id,
    departmentName: departmentMap.get(major.department_id) ?? "Chưa có",
    id: major.id,
    is_active: major.is_active,
    name: major.name,
  })).filter((major) => {
    if (
      query &&
      ![major.code, major.name, major.departmentName]
        .join(" ")
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }

    if (departmentFilter && major.departmentId !== departmentFilter) {
      return false;
    }

    if (statusFilter) {
      const statusValue = major.is_active ? "ACTIVE" : "INACTIVE";
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
  const returnTo = buildReturnPath("/admin/majors", [
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
        description="Ngành liên kết với khoa và là trục chính để gắn lớp sinh hoạt."
        title="Quản lý ngành"
      />
      {error || success ? (
        <FormAlert message={error || success} success={!error} />
      ) : null}
      <FormPanelCard
        description="Lọc theo khoa, trạng thái và từ khóa để rà nhanh danh mục ngành."
        title="Bộ lọc ngành"
      >
        <FilterToolbar
          key={`${queryValue}|${departmentFilter}|${statusFilter}`}
          searchPlaceholder="Tìm mã ngành, tên ngành, khoa"
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
        <MajorsTable data={rows} returnTo={returnTo} />
        <Suspense
          fallback={<FormCardSkeleton sections={2} title="Đang tải biểu mẫu ngành" />}
          key={editId ?? "create"}
        >
          <MajorEditorCard
            departments={departments}
            editId={editId}
            returnTo={returnTo}
          />
        </Suspense>
      </div>
    </div>
  );
}
