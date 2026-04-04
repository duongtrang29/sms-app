import Link from "next/link";
import { Suspense } from "react";

import { AcademicClassesTable } from "@/components/dashboard/academic-classes-table";
import { FormAlert } from "@/components/forms/form-alert";
import { AcademicClassForm } from "@/components/forms/academic-class-form";
import {
  FormCardSkeleton,
  FormPanelCard,
} from "@/components/forms/form-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getAcademicClassById, listAcademicClasses } from "@/features/academic-classes/queries";
import { listMajors } from "@/features/majors/queries";
import { buildReturnPath, getSearchParamString } from "@/lib/admin-routing";
import { mapOptions } from "@/lib/options";

type AcademicClassesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function AcademicClassEditorCard({
  editId,
  majors,
  returnTo,
}: {
  editId: string | null;
  majors: Awaited<ReturnType<typeof listMajors>>;
  returnTo: string;
}) {
  const academicClass = editId ? await getAcademicClassById(editId) : null;

  return (
    <FormPanelCard
      description="Biểu mẫu lớp sinh hoạt sẽ tự động điền sẵn dữ liệu khi chuyển sang chế độ sửa."
      title={academicClass ? "Cập nhật lớp" : "Tạo lớp mới"}
    >
      <AcademicClassForm
        academicClass={academicClass}
        key={`academic-class-form-${editId ?? "create"}`}
        majors={majors}
        returnTo={returnTo}
      />
    </FormPanelCard>
  );
}

export default async function AcademicClassesPage({
  searchParams,
}: AcademicClassesPageProps) {
  const resolvedSearchParams = await searchParams;
  const editId = getSearchParamString(resolvedSearchParams, "edit") || null;
  const error = getSearchParamString(resolvedSearchParams, "error");
  const majorFilter = getSearchParamString(resolvedSearchParams, "major");
  const queryValue = getSearchParamString(resolvedSearchParams, "q");
  const query = queryValue.toLowerCase();
  const statusFilter = getSearchParamString(resolvedSearchParams, "status");
  const success = getSearchParamString(resolvedSearchParams, "success");

  const [majors, academicClasses] = await Promise.all([
    listMajors(),
    listAcademicClasses(),
  ]);

  const majorMap = new Map(majors.map((major) => [major.id, major.name]));
  const rows = academicClasses.map((academicClass) => ({
    code: academicClass.code,
    cohort_year: academicClass.cohort_year,
    id: academicClass.id,
    is_active: academicClass.is_active,
    majorId: academicClass.major_id,
    majorName: majorMap.get(academicClass.major_id) ?? "Chưa có",
    name: academicClass.name,
  })).filter((academicClass) => {
    if (
      query &&
      ![academicClass.code, academicClass.name, academicClass.majorName]
        .join(" ")
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }

    if (majorFilter && academicClass.majorId !== majorFilter) {
      return false;
    }

    if (statusFilter) {
      const statusValue = academicClass.is_active ? "ACTIVE" : "INACTIVE";
      if (statusValue !== statusFilter) {
        return false;
      }
    }

    return true;
  });
  const majorOptions = mapOptions(
    majors,
    (major) => `${major.code} - ${major.name}`,
  );
  const returnTo = buildReturnPath("/admin/classes", [
    ["q", queryValue],
    ["major", majorFilter],
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
        description="Lớp sinh hoạt là đơn vị gắn sinh viên theo khóa, ngành và báo cáo học tập."
        title="Quản lý lớp sinh hoạt"
      />
      {error || success ? (
        <FormAlert message={error || success} success={!error} />
      ) : null}
      <FormPanelCard
        description="Lọc theo ngành, trạng thái và từ khóa để kiểm soát lớp sinh hoạt rõ ràng hơn."
        title="Bộ lọc lớp sinh hoạt"
      >
        <FilterToolbar
          key={`${queryValue}|${majorFilter}|${statusFilter}`}
          searchPlaceholder="Tìm mã lớp, tên lớp, ngành"
          searchValue={queryValue}
          selects={[
            {
              key: "major",
              label: "Ngành",
              options: majorOptions,
              placeholder: "Tất cả ngành",
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
        <AcademicClassesTable data={rows} returnTo={returnTo} />
        <Suspense
          fallback={<FormCardSkeleton sections={2} title="Đang tải biểu mẫu lớp" />}
          key={editId ?? "create"}
        >
          <AcademicClassEditorCard
            editId={editId}
            majors={majors}
            returnTo={returnTo}
          />
        </Suspense>
      </div>
    </div>
  );
}
