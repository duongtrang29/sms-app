import Link from "next/link";
import { Suspense } from "react";

import { SemestersTable } from "@/components/dashboard/semesters-table";
import { FormAlert } from "@/components/forms/form-alert";
import { SemesterForm } from "@/components/forms/semester-form";
import {
  FormCardSkeleton,
  FormPanelCard,
} from "@/components/forms/form-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getSemesterById, listSemesters } from "@/features/semesters/queries";
import { buildReturnPath, getSearchParamString } from "@/lib/admin-routing";

type SemestersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function SemesterEditorCard({
  editId,
  returnTo,
}: {
  editId: string | null;
  returnTo: string;
}) {
  const semester = editId ? await getSemesterById(editId) : null;

  return (
    <FormPanelCard
      description="Cùng một biểu mẫu được dùng cho tạo mới và cập nhật học kỳ."
      title={semester ? "Cập nhật học kỳ" : "Tạo học kỳ mới"}
    >
      <SemesterForm
        key={`semester-form-${editId ?? "create"}`}
        returnTo={returnTo}
        semester={semester}
      />
    </FormPanelCard>
  );
}

export default async function SemestersPage({
  searchParams,
}: SemestersPageProps) {
  const resolvedSearchParams = await searchParams;
  const currentFilter = getSearchParamString(resolvedSearchParams, "current");
  const editId = getSearchParamString(resolvedSearchParams, "edit") || null;
  const error = getSearchParamString(resolvedSearchParams, "error");
  const queryValue = getSearchParamString(resolvedSearchParams, "q");
  const query = queryValue.toLowerCase();
  const success = getSearchParamString(resolvedSearchParams, "success");
  const semesters = await listSemesters();
  const rows = semesters.filter((semester) => {
    if (
      query &&
      ![semester.code, semester.name, semester.academic_year]
        .join(" ")
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }

    if (currentFilter) {
      const currentValue = semester.is_current ? "YES" : "NO";
      if (currentValue !== currentFilter) {
        return false;
      }
    }

    return true;
  });
  const returnTo = buildReturnPath("/admin/semesters", [
    ["q", queryValue],
    ["current", currentFilter],
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
        description="Quản lý thời gian học kỳ, thời gian đăng ký học phần và cửa sổ phúc khảo."
        title="Quản lý học kỳ"
      />
      {error || success ? (
        <FormAlert message={error || success} success={!error} />
      ) : null}
      <FormPanelCard
        description="Tìm học kỳ theo mã, tên, năm học hoặc thu gọn theo trạng thái hiện hành."
        title="Bộ lọc học kỳ"
      >
        <FilterToolbar
          key={`${queryValue}|${currentFilter}`}
          searchPlaceholder="Tìm mã học kỳ, tên học kỳ, năm học"
          searchValue={queryValue}
          selects={[
            {
              key: "current",
              label: "Hiện hành",
              options: [
                { label: "Đang hiện hành", value: "YES" },
                { label: "Không hiện hành", value: "NO" },
              ],
              placeholder: "Tất cả học kỳ",
            },
          ]}
        />
      </FormPanelCard>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.9fr)]">
        <SemestersTable data={rows} returnTo={returnTo} />
        <Suspense
          fallback={<FormCardSkeleton sections={3} title="Đang tải biểu mẫu học kỳ" />}
          key={editId ?? "create"}
        >
          <SemesterEditorCard editId={editId} returnTo={returnTo} />
        </Suspense>
      </div>
    </div>
  );
}
