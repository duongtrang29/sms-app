"use client";

import { PencilLineIcon, Trash2Icon } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { InlineActionForm } from "@/components/shared/inline-action-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActionLink } from "@/components/shared/table-action-button";
import { deleteCourseOfferingFormAction } from "@/features/course-offerings/actions";
import { buildEditPath } from "@/lib/admin-routing";

type CourseOfferingTableRow = {
  courseName: string;
  enrollment: string;
  id: string;
  lecturerName: string;
  section_code: string;
  semesterName: string;
  status: string;
};

const columnHelper = createColumnHelper<CourseOfferingTableRow>();

function buildColumns(returnTo: string) {
  return [
    columnHelper.accessor("courseName", { header: "Môn học" }),
    columnHelper.accessor("semesterName", { header: "Học kỳ" }),
    columnHelper.accessor("section_code", { header: "Nhóm" }),
    columnHelper.accessor("lecturerName", { header: "Giảng viên" }),
    columnHelper.accessor("enrollment", { header: "Đăng ký" }),
    columnHelper.accessor("status", { header: "Trạng thái", cell: (info) => <StatusBadge value={info.getValue()} /> }),
    columnHelper.display({
      id: "actions",
      header: "Thao tác",
      meta: {
        align: "right",
        cellClassName: "w-24",
        headerClassName: "w-24",
      },
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <TableActionLink
            href={buildEditPath(returnTo, row.original.id)}
            icon={<PencilLineIcon aria-hidden="true" className="size-4" />}
            label="Sửa học phần mở"
          />
          <InlineActionForm
            action={deleteCourseOfferingFormAction}
            confirmMessage={`Xóa học phần ${row.original.section_code}? Chỉ nên xóa khi chưa có đăng ký.`}
            fields={[
              { name: "offering_id", value: row.original.id },
              { name: "return_to", value: returnTo },
            ]}
            icon={<Trash2Icon aria-hidden="true" className="size-4" />}
            iconOnly
            label="Xóa"
            pendingLabel="Đang xóa"
            tooltip="Xóa học phần mở"
            variant="destructive"
          />
        </div>
      ),
    }),
  ] as unknown as ColumnDef<CourseOfferingTableRow, unknown>[];
}

export function CourseOfferingsTable({
  data,
  returnTo = "/admin/offerings",
}: {
  data: CourseOfferingTableRow[];
  returnTo?: string;
}) {
  return (
    <DataTable
      columns={buildColumns(returnTo)}
      data={data}
      emptyDescription="Mở học phần theo học kỳ để sinh viên có thể đăng ký."
      emptyTitle="Chưa có học phần mở"
    />
  );
}
