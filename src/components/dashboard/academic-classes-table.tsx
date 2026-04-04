"use client";

import { CircleOffIcon, PencilLineIcon, RotateCcwIcon } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { InlineActionForm } from "@/components/shared/inline-action-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActionLink } from "@/components/shared/table-action-button";
import { toggleAcademicClassStatusFormAction } from "@/features/academic-classes/actions";
import { buildEditPath } from "@/lib/admin-routing";

type AcademicClassTableRow = {
  code: string;
  cohort_year: number;
  id: string;
  is_active: boolean;
  majorName: string;
  name: string;
};

const columnHelper = createColumnHelper<AcademicClassTableRow>();

function buildColumns(returnTo: string) {
  return [
  columnHelper.accessor("code", {
    header: "Mã lớp",
  }),
  columnHelper.accessor("name", {
    header: "Tên lớp",
  }),
  columnHelper.accessor("majorName", {
    header: "Ngành",
  }),
  columnHelper.accessor("cohort_year", {
    header: "Khóa",
    meta: {
      align: "right",
    },
  }),
  columnHelper.accessor("is_active", {
    header: "Trạng thái",
    cell: (info) => (
      <StatusBadge value={info.getValue() ? "ACTIVE" : "INACTIVE"} />
    ),
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
          label="Sửa lớp sinh hoạt"
        />
        <InlineActionForm
          action={toggleAcademicClassStatusFormAction}
          confirmMessage={
            row.original.is_active
              ? `Tạm ngưng lớp ${row.original.code}? Sinh viên hiện có vẫn được giữ nguyên, nhưng lớp sẽ không dùng cho dữ liệu mới.`
              : `Kích hoạt lại lớp ${row.original.code}?`
          }
          fields={[
            { name: "academic_class_id", value: row.original.id },
            {
              name: "next_status",
              value: row.original.is_active ? "INACTIVE" : "ACTIVE",
            },
            { name: "return_to", value: returnTo },
          ]}
          icon={
            row.original.is_active ? (
              <CircleOffIcon aria-hidden="true" className="size-4" />
            ) : (
              <RotateCcwIcon aria-hidden="true" className="size-4" />
            )
          }
          iconOnly
          label={row.original.is_active ? "Tạm ngưng" : "Kích hoạt"}
          pendingLabel="Đang cập nhật"
          tooltip={row.original.is_active ? "Tạm ngưng lớp" : "Kích hoạt lớp"}
          variant={row.original.is_active ? "outline" : "success"}
        />
      </div>
    ),
  }),
  ] as unknown as ColumnDef<AcademicClassTableRow, unknown>[];
}

type AcademicClassesTableProps = {
  data: AcademicClassTableRow[];
  returnTo?: string;
};

export function AcademicClassesTable({
  data,
  returnTo = "/admin/classes",
}: AcademicClassesTableProps) {
  return (
    <DataTable
      columns={buildColumns(returnTo)}
      data={data}
      emptyDescription="Tạo lớp sinh hoạt để gắn sinh viên vào đúng khóa và ngành."
      emptyTitle="Chưa có lớp sinh hoạt"
    />
  );
}
