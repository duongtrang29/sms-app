"use client";

import { PencilLineIcon, Trash2Icon } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { InlineActionForm } from "@/components/shared/inline-action-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActionLink } from "@/components/shared/table-action-button";
import { deleteCourseFormAction } from "@/features/courses/actions";
import { buildEditPath } from "@/lib/admin-routing";

type CourseTableRow = {
  code: string;
  credit_hours: number;
  departmentName: string;
  id: string;
  is_active: boolean;
  name: string;
};

const columnHelper = createColumnHelper<CourseTableRow>();

function buildColumns(returnTo: string) {
  return [
    columnHelper.accessor("code", { header: "Mã môn" }),
    columnHelper.accessor("name", { header: "Tên môn" }),
    columnHelper.accessor("departmentName", { header: "Khoa" }),
    columnHelper.accessor("credit_hours", {
      header: "Tín chỉ",
      meta: {
        align: "right",
      },
    }),
    columnHelper.accessor("is_active", {
      header: "Trạng thái",
      cell: (info) => <StatusBadge value={info.getValue() ? "ACTIVE" : "INACTIVE"} />,
    }),
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
            label="Sửa môn học"
          />
          <InlineActionForm
            action={deleteCourseFormAction}
            confirmMessage={`Xóa môn học ${row.original.code}? Thao tác này không thể hoàn tác.`}
            fields={[
              { name: "course_id", value: row.original.id },
              { name: "return_to", value: returnTo },
            ]}
            icon={<Trash2Icon aria-hidden="true" className="size-4" />}
            iconOnly
            label="Xóa"
            pendingLabel="Đang xóa"
            tooltip="Xóa môn học"
            variant="destructive"
          />
        </div>
      ),
    }),
  ] as unknown as ColumnDef<CourseTableRow, unknown>[];
}

export function CoursesTable({
  data,
  returnTo = "/admin/courses",
}: {
  data: CourseTableRow[];
  returnTo?: string;
}) {
  return (
    <DataTable
      columns={buildColumns(returnTo)}
      data={data}
      emptyDescription="Tạo môn học trước khi mở học phần theo từng học kỳ."
      emptyTitle="Chưa có môn học"
    />
  );
}
