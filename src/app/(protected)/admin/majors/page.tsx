import Link from "next/link";
import { Suspense } from "react";
import { BookOpenIcon, PlusIcon } from "lucide-react";

import { MajorsTable } from "@/components/dashboard/majors-table";
import { FormAlert } from "@/components/forms/form-alert";
import { MajorForm } from "@/components/forms/major-form";
import { FormCardSkeleton } from "@/components/forms/form-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { RoutePanel } from "@/components/shared/route-panel";
import { SectionPanel } from "@/components/shared/section-panel";
import { Button } from "@/components/ui/button";
import { listDepartments } from "@/features/departments/queries";
import { getMajorById, listMajors } from "@/features/majors/queries";
import {
  buildCreatePath,
  buildReturnPath,
  getSearchParamString,
} from "@/lib/admin-routing";
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
    <MajorForm
      key={`major-form-${editId ?? "create"}`}
      departments={departments}
      major={major}
      returnTo={returnTo}
    />
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
  const mode = getSearchParamString(resolvedSearchParams, "mode");

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
        description="Danh mục ngành đào tạo."
        icon={<BookOpenIcon className="size-5" />}
        info="Ngành liên kết với khoa và là trục chính để gắn lớp sinh hoạt."
        title="Ngành"
      />
      {error || success ? (
        <FormAlert message={error || success} success={!error} />
      ) : null}
      <SectionPanel>
        <FilterToolbar
          key={`${queryValue}|${departmentFilter}|${statusFilter}`}
          resultCount={rows.length}
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
      </SectionPanel>
      <MajorsTable data={rows} returnTo={returnTo} />
      <RoutePanel
        badge={editId ? "Chỉnh sửa" : "Thêm mới"}
        closeHref={returnTo}
        description="Quản lý mã ngành, khoa chủ quản và trạng thái sử dụng."
        icon={<BookOpenIcon className="size-5" />}
        open={isEditorOpen}
        title={editId ? "Cập nhật ngành" : "Thêm ngành"}
        variant="dialog"
      >
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
      </RoutePanel>
    </div>
  );
}
