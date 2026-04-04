import Link from "next/link";
import { Suspense } from "react";

import { StudentsTable } from "@/components/dashboard/students-table";
import { FormAlert } from "@/components/forms/form-alert";
import { StudentForm } from "@/components/forms/student-form";
import { StudentImportForm } from "@/components/forms/student-import-form";
import {
  FormCardSkeleton,
  FormPanelCard,
} from "@/components/forms/form-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { listAcademicClasses } from "@/features/academic-classes/queries";
import { getStudentById, listStudents } from "@/features/students/queries";
import { buildReturnPath, getSearchParamString } from "@/lib/admin-routing";
import { mapOptions } from "@/lib/options";

type StudentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function StudentEditorCard({
  academicClasses,
  editId,
  returnTo,
}: {
  academicClasses: Awaited<ReturnType<typeof listAcademicClasses>>;
  editId: string | null;
  returnTo: string;
}) {
  const student = editId ? await getStudentById(editId) : null;

  return (
    <FormPanelCard
      description="Dữ liệu hồ sơ, học tập và liên hệ sẽ được điền sẵn khi mở chế độ sửa."
      title={student ? "Cập nhật sinh viên" : "Tạo sinh viên mới"}
    >
      <StudentForm
        academicClasses={academicClasses}
        key={`student-form-${editId ?? "create"}`}
        returnTo={returnTo}
        student={student}
      />
    </FormPanelCard>
  );
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const resolvedSearchParams = await searchParams;
  const accessFilter = getSearchParamString(resolvedSearchParams, "access");
  const academicFilter = getSearchParamString(resolvedSearchParams, "academic");
  const classFilter = getSearchParamString(resolvedSearchParams, "class");
  const editId = getSearchParamString(resolvedSearchParams, "edit") || null;
  const error = getSearchParamString(resolvedSearchParams, "error");
  const queryValue = getSearchParamString(resolvedSearchParams, "q");
  const query = queryValue.toLowerCase();
  const success = getSearchParamString(resolvedSearchParams, "success");

  const [academicClasses, students] = await Promise.all([
    listAcademicClasses(),
    listStudents(),
  ]);

  const classMap = new Map(
    academicClasses.map((academicClass) => [
      academicClass.id,
      `${academicClass.code} - ${academicClass.name}`,
    ]),
  );
  const allRows = students.map((student) => ({
    academic_class_code: classMap.get(student.academic_class_id) ?? "Chưa có",
    academic_class_id: student.academic_class_id,
    access_status: student.access_status,
    current_status: student.current_status,
    full_name: student.full_name,
    id: student.id,
    student_code: student.student_code,
  }));

  const rows = allRows.filter((student) => {
    if (
      query &&
      ![
        student.student_code,
        student.full_name,
        student.academic_class_code,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }

    if (accessFilter && student.access_status !== accessFilter) {
      return false;
    }

    if (academicFilter && student.current_status !== academicFilter) {
      return false;
    }

    if (classFilter && student.academic_class_id !== classFilter) {
      return false;
    }

    return true;
  });

  const classOptions = mapOptions(
    academicClasses,
    (academicClass) => `${academicClass.code} - ${academicClass.name}`,
  );
  const returnTo = buildReturnPath("/admin/students", [
    ["q", queryValue],
    ["access", accessFilter],
    ["academic", academicFilter],
    ["class", classFilter],
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
        description="Quản trị viên có thể tạo sinh viên thủ công hoặc nhập tệp CSV để kiểm thử đầy đủ luồng học vụ, đăng ký và điểm."
        eyebrow="Khu quản trị"
        title="Quản lý sinh viên"
      />
      {error || success ? (
        <FormAlert message={error || success} success={!error} />
      ) : null}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          description="Tổng hồ sơ sinh viên hiện có."
          label="Tổng sinh viên"
          tone="primary"
          value={allRows.length}
        />
        <StatCard
          description="Tài khoản có thể đăng nhập hệ thống."
          label="Truy cập khả dụng"
          tone="success"
          value={allRows.filter((row) => row.access_status === "ACTIVE").length}
        />
        <StatCard
          description="Sinh viên đang học tập bình thường."
          label="Đang học"
          tone="info"
          value={allRows.filter((row) => row.current_status === "ACTIVE").length}
        />
        <StatCard
          description="Số bản ghi đang hiển thị theo bộ lọc."
          label="Dòng đang hiển thị"
          tone="neutral"
          value={rows.length}
        />
      </div>
      <FormPanelCard
        description="Tìm nhanh theo MSSV, họ tên hoặc thu gọn theo lớp và trạng thái."
        title="Bộ lọc sinh viên"
      >
        <FilterToolbar
          key={`${queryValue}|${accessFilter}|${academicFilter}|${classFilter}`}
          searchPlaceholder="Tìm MSSV, họ tên, lớp"
          searchValue={queryValue}
          selects={[
            {
              key: "access",
              label: "Truy cập",
              options: [
                { label: "Đang hoạt động", value: "ACTIVE" },
                { label: "Tạm ngưng", value: "INACTIVE" },
                { label: "Đã khóa", value: "LOCKED" },
              ],
              placeholder: "Tất cả truy cập",
            },
            {
              key: "academic",
              label: "Học tập",
              options: [
                { label: "Đang học", value: "ACTIVE" },
                { label: "Tạm dừng", value: "SUSPENDED" },
                { label: "Đã tốt nghiệp", value: "GRADUATED" },
                { label: "Đã thôi học", value: "DROPPED" },
              ],
              placeholder: "Tất cả học tập",
            },
            {
              key: "class",
              label: "Lớp",
              options: classOptions,
              placeholder: "Tất cả lớp",
            },
          ]}
        />
      </FormPanelCard>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.95fr)]">
        <StudentsTable data={rows} returnTo={returnTo} />
        <div className="flex flex-col gap-6">
          <FormPanelCard
            description="Nhập nhanh dữ liệu minh họa hoặc dữ liệu tuyển sinh theo mẫu CSV của hệ thống."
            title="Nhập sinh viên từ CSV"
          >
            <StudentImportForm />
          </FormPanelCard>
          <Suspense
            fallback={<FormCardSkeleton sections={4} title="Đang tải hồ sơ sinh viên" />}
            key={editId ?? "create"}
          >
            <StudentEditorCard
              academicClasses={academicClasses}
              editId={editId}
              returnTo={returnTo}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
