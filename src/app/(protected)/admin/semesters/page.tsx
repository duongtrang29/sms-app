import Link from "next/link";
import { Suspense } from "react";
import { CalendarRangeIcon, PlusIcon } from "lucide-react";

import { SemestersTable } from "@/components/dashboard/semesters-table";
import { FormAlert } from "@/components/forms/form-alert";
import { SemesterForm } from "@/components/forms/semester-form";
import { FormCardSkeleton } from "@/components/forms/form-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { RoutePanel } from "@/components/shared/route-panel";
import { SectionPanel } from "@/components/shared/section-panel";
import { Button } from "@/components/ui/button";
import { getSemesterById, listSemesters } from "@/features/semesters/queries";
import {
  buildCreatePath,
  buildReturnPath,
  getSearchParamString,
} from "@/lib/admin-routing";

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
    <SemesterForm
      key={`semester-form-${editId ?? "create"}`}
      returnTo={returnTo}
      semester={semester}
    />
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
  const mode = getSearchParamString(resolvedSearchParams, "mode");
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
        description="Khung thời gian học kỳ."
        icon={<CalendarRangeIcon className="size-5" />}
        info="Quản lý thời gian học kỳ, thời gian đăng ký học phần và cửa sổ phúc khảo."
        title="Học kỳ"
      />
      {error || success ? (
        <FormAlert message={error || success} success={!error} />
      ) : null}
      <SectionPanel>
        <FilterToolbar
          key={`${queryValue}|${currentFilter}`}
          resultCount={rows.length}
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
      </SectionPanel>
      <SemestersTable data={rows} returnTo={returnTo} />
      <RoutePanel
        badge={editId ? "Chỉnh sửa" : "Thêm mới"}
        closeHref={returnTo}
        description="Quản lý thời gian học, đăng ký và cửa sổ phúc khảo theo học kỳ."
        icon={<CalendarRangeIcon className="size-5" />}
        open={isEditorOpen}
        size="xl"
        title={editId ? "Cập nhật học kỳ" : "Thêm học kỳ"}
        variant="dialog"
      >
        <Suspense
          fallback={<FormCardSkeleton sections={3} title="Đang tải biểu mẫu học kỳ" />}
          key={editId ?? "create"}
        >
          <SemesterEditorCard editId={editId} returnTo={returnTo} />
        </Suspense>
      </RoutePanel>
    </div>
  );
}
