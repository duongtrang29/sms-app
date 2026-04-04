import Link from "next/link";
import { Suspense } from "react";

import { CourseOfferingsTable } from "@/components/dashboard/course-offerings-table";
import { CourseOfferingForm } from "@/components/forms/course-offering-form";
import { FormAlert } from "@/components/forms/form-alert";
import {
  FormCardSkeleton,
  FormPanelCard,
} from "@/components/forms/form-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { listCourses } from "@/features/courses/queries";
import {
  getCourseOfferingById,
  listCourseOfferings,
  listPrimaryTeachingAssignments,
} from "@/features/course-offerings/queries";
import { listLecturers } from "@/features/lecturers/queries";
import { listSemesters } from "@/features/semesters/queries";
import { buildReturnPath, getSearchParamString } from "@/lib/admin-routing";
import { mapOptions } from "@/lib/options";
import type { SelectOption } from "@/types/forms";

type OfferingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function CourseOfferingEditorCard({
  courseOptions,
  editId,
  lecturerOptions,
  returnTo,
  semesterOptions,
}: {
  courseOptions: SelectOption[];
  editId: string | null;
  lecturerOptions: SelectOption[];
  returnTo: string;
  semesterOptions: SelectOption[];
}) {
  const offering = editId ? await getCourseOfferingById(editId) : null;

  return (
    <FormPanelCard
        description="Các trường liên kết đều hiển thị nhãn dễ đọc, khi gửi dữ liệu vẫn dùng mã định danh ở nền dưới."
        title={offering ? "Cập nhật học phần" : "Mở học phần mới"}
    >
      <CourseOfferingForm
        courseOptions={courseOptions}
        key={`offering-form-${editId ?? "create"}`}
        lecturerOptions={lecturerOptions}
        offering={offering}
        returnTo={returnTo}
        semesterOptions={semesterOptions}
      />
    </FormPanelCard>
  );
}

export default async function OfferingsPage({ searchParams }: OfferingsPageProps) {
  const resolvedSearchParams = await searchParams;
  const editId = getSearchParamString(resolvedSearchParams, "edit") || null;
  const error = getSearchParamString(resolvedSearchParams, "error");
  const queryValue = getSearchParamString(resolvedSearchParams, "q");
  const query = queryValue.toLowerCase();
  const semesterFilter = getSearchParamString(resolvedSearchParams, "semester");
  const success = getSearchParamString(resolvedSearchParams, "success");
  const statusFilter = getSearchParamString(resolvedSearchParams, "status");
  const returnTo = buildReturnPath("/admin/offerings", [
    ["q", queryValue],
    ["semester", semesterFilter],
    ["status", statusFilter],
  ]);

  const [courses, offerings, lecturers, primaryAssignments, semesters] =
    await Promise.all([
      listCourses(),
      listCourseOfferings(),
      listLecturers(),
      listPrimaryTeachingAssignments(),
      listSemesters(),
    ]);

  const courseMap = new Map(
    courses.map((course) => [course.id, `${course.code} - ${course.name}`]),
  );
  const lecturerMap = new Map(
    lecturers.map((lecturer) => [
      lecturer.id,
      `${lecturer.employee_code} - ${lecturer.full_name}`,
    ]),
  );
  const semesterMap = new Map(
    semesters.map((semester) => [
      semester.id,
      `${semester.code} - ${semester.name}`,
    ]),
  );
  const assignmentMap = new Map(
    primaryAssignments.map((assignment) => [
      assignment.course_offering_id,
      assignment.lecturer_id,
    ]),
  );

  const allRows = offerings.map((offering) => ({
    courseName: courseMap.get(offering.course_id) ?? "Chưa có",
    enrollment: `${offering.enrolled_count}/${offering.max_capacity}`,
    id: offering.id,
    lecturerName:
      lecturerMap.get(assignmentMap.get(offering.id) ?? "") ?? "Chưa gán",
    section_code: offering.section_code,
    semesterId: offering.semester_id,
    semesterName: semesterMap.get(offering.semester_id) ?? "Chưa có",
    status: offering.status,
  }));

  const rows = allRows.filter((offering) => {
    if (
      query &&
      ![
        offering.courseName,
        offering.lecturerName,
        offering.section_code,
        offering.semesterName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }

    if (semesterFilter && offering.semesterId !== semesterFilter) {
      return false;
    }

    if (statusFilter && offering.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const courseOptions = mapOptions(
    courses,
    (course) => `${course.code} - ${course.name}`,
  );
  const lecturerOptions = mapOptions(
    lecturers,
    (lecturer) => `${lecturer.employee_code} - ${lecturer.full_name}`,
  );
  const semesterOptions = mapOptions(
    semesters,
    (semester) => `${semester.code} - ${semester.name}`,
  );

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
        description="Mỗi học phần mở thuộc một môn học và một học kỳ, có giảng viên chính và quy tắc đăng ký riêng."
        eyebrow="Khu quản trị"
        title="Quản lý học phần mở"
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          description="Tổng số học phần đã cấu hình trong hệ thống."
          label="Tổng học phần mở"
          tone="primary"
          value={allRows.length}
        />
        <StatCard
          description="Học phần hiện còn đang mở cho sinh viên đăng ký."
          label="Đang mở"
          tone="info"
          value={allRows.filter((row) => row.status === "OPEN").length}
        />
        <StatCard
          description="Học phần đã hoàn tất hoặc đóng đăng ký."
          label="Đã đóng / kết thúc"
          tone="neutral"
          value={
            allRows.filter(
              (row) => row.status === "CLOSED" || row.status === "FINISHED",
            ).length
          }
        />
        <StatCard
          description="Số dòng còn lại theo bộ lọc hiện tại."
          label="Dòng đang hiển thị"
          tone="success"
          value={rows.length}
        />
      </div>
      {error || success ? (
        <FormAlert message={error || success} success={!error} />
      ) : null}
      <FormPanelCard
        description="Bộ lọc theo học kỳ và trạng thái dùng đường dẫn trang làm nguồn dữ liệu chuẩn, ô tìm kiếm cập nhật trễ tự động."
        title="Bộ lọc học phần mở"
      >
        <FilterToolbar
          key={`${queryValue}|${semesterFilter}|${statusFilter}`}
          searchPlaceholder="Tìm môn học, giảng viên, nhóm, học kỳ"
          searchValue={queryValue}
          selects={[
            {
              key: "semester",
              label: "Học kỳ",
              options: semesterOptions,
              placeholder: "Tất cả học kỳ",
            },
            {
              key: "status",
              label: "Trạng thái",
              options: [
                { label: "Nháp", value: "DRAFT" },
                { label: "Mở đăng ký", value: "OPEN" },
                { label: "Đã đóng", value: "CLOSED" },
                { label: "Kết thúc", value: "FINISHED" },
                { label: "Đã hủy", value: "CANCELLED" },
              ],
              placeholder: "Tất cả trạng thái",
            },
          ]}
        />
      </FormPanelCard>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.98fr)]">
        <CourseOfferingsTable data={rows} returnTo={returnTo} />
        <Suspense
          fallback={<FormCardSkeleton sections={3} title="Đang tải học phần mở" />}
          key={editId ?? "create"}
        >
          <CourseOfferingEditorCard
            courseOptions={courseOptions}
            editId={editId}
            lecturerOptions={lecturerOptions}
            returnTo={returnTo}
            semesterOptions={semesterOptions}
          />
        </Suspense>
      </div>
    </div>
  );
}
