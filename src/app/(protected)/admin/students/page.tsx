import Link from "next/link";
import { Suspense } from "react";
import {
  GraduationCapIcon,
  PlusIcon,
  ShieldCheckIcon,
  UploadIcon,
  UsersIcon,
} from "lucide-react";

import { StudentsTable } from "@/components/dashboard/students-table";
import { FormAlert } from "@/components/forms/form-alert";
import { StudentForm } from "@/components/forms/student-form";
import { StudentImportForm } from "@/components/forms/student-import-form";
import { FormCardSkeleton } from "@/components/forms/form-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { RoutePanel } from "@/components/shared/route-panel";
import { SectionPanel } from "@/components/shared/section-panel";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listAcademicClasses } from "@/features/academic-classes/queries";
import { getStudentById, listStudents } from "@/features/students/queries";
import {
  buildCreatePath,
  buildImportPath,
  buildReturnPath,
  getSearchParamString,
} from "@/lib/admin-routing";
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
    <StudentForm
      academicClasses={academicClasses}
      key={`student-form-${editId ?? "create"}`}
      returnTo={returnTo}
      student={student}
    />
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
  const mode = getSearchParamString(resolvedSearchParams, "mode");

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
  const isCreateOpen = mode === "create" || mode === "import";
  const isEditorOpen = isCreateOpen || Boolean(editId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={buildCreatePath(returnTo)}>
              <Button type="button">
                <PlusIcon data-icon="inline-start" />
                Thêm mới
              </Button>
            </Link>
            <Link href={buildImportPath(returnTo)}>
              <Button type="button" variant="outline">
                <UploadIcon data-icon="inline-start" />
                Import
              </Button>
            </Link>
          </div>
        }
        description="Hồ sơ sinh viên & trạng thái học tập."
        icon={<GraduationCapIcon className="size-5" />}
        info="Quản trị viên có thể tạo sinh viên thủ công hoặc nhập tệp CSV để kiểm thử đầy đủ luồng học vụ, đăng ký và điểm."
        title="Sinh viên"
      />
      {error || success ? (
        <FormAlert message={error || success} success={!error} />
      ) : null}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          description="Tổng hồ sơ sinh viên hiện có."
          icon={<UsersIcon className="size-4" />}
          label="Tổng sinh viên"
          tone="primary"
          value={allRows.length}
        />
        <StatCard
          description="Tài khoản có thể đăng nhập hệ thống."
          icon={<ShieldCheckIcon className="size-4" />}
          label="Truy cập khả dụng"
          tone="success"
          value={allRows.filter((row) => row.access_status === "ACTIVE").length}
        />
        <StatCard
          description="Sinh viên đang học tập bình thường."
          icon={<GraduationCapIcon className="size-4" />}
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
      <SectionPanel>
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
      </SectionPanel>
      <StudentsTable data={rows} returnTo={returnTo} />
      <RoutePanel
        badge={
          editId
            ? "Chỉnh sửa"
            : mode === "import"
              ? "Import"
              : "Thêm mới"
        }
        closeHref={returnTo}
        description="Tạo hồ sơ thủ công hoặc import CSV trong cùng một luồng thao tác."
        icon={<GraduationCapIcon className="size-5" />}
        open={isEditorOpen}
        size="xl"
        title={editId ? "Cập nhật sinh viên" : "Thêm sinh viên"}
        variant="drawer"
      >
        {editId ? (
          <Suspense
            fallback={<FormCardSkeleton sections={4} title="Đang tải hồ sơ sinh viên" />}
            key={editId}
          >
            <StudentEditorCard
              academicClasses={academicClasses}
              editId={editId}
              returnTo={returnTo}
            />
          </Suspense>
        ) : (
          <Tabs defaultValue={mode === "import" ? "import" : "manual"}>
            <TabsList className="mb-5">
              <TabsTrigger value="manual">
                <PlusIcon data-icon="inline-start" />
                Nhập thủ công
              </TabsTrigger>
              <TabsTrigger value="import">
                <UploadIcon data-icon="inline-start" />
                Import CSV
              </TabsTrigger>
            </TabsList>
            <TabsContent value="manual">
              <Suspense
                fallback={<FormCardSkeleton sections={4} title="Đang tải hồ sơ sinh viên" />}
                key="student-create"
              >
                <StudentEditorCard
                  academicClasses={academicClasses}
                  editId={null}
                  returnTo={returnTo}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="import">
              <StudentImportForm />
            </TabsContent>
          </Tabs>
        )}
      </RoutePanel>
    </div>
  );
}
