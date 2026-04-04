"use client";

import { CircleOffIcon, PencilLineIcon, RotateCcwIcon } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { InlineActionForm } from "@/components/shared/inline-action-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActionLink } from "@/components/shared/table-action-button";
import { toggleMajorStatusFormAction } from "@/features/majors/actions";
import { buildEditPath } from "@/lib/admin-routing";

type MajorTableRow = {
  code: string;
  departmentName: string;
  id: string;
  is_active: boolean;
  name: string;
};

const columnHelper = createColumnHelper<MajorTableRow>();

function buildColumns(returnTo: string) {
  return [
  columnHelper.accessor("code", {
    header: "Mã ngành",
  }),
  columnHelper.accessor("name", {
    header: "Tên ngành",
  }),
  columnHelper.accessor("departmentName", {
    header: "Khoa",
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
          label="Sửa ngành"
        />
        <InlineActionForm
          action={toggleMajorStatusFormAction}
          confirmMessage={
            row.original.is_active
              ? `Tạm ngưng ngành ${row.original.code}? Ngành sẽ không còn xuất hiện trong các luồng tạo dữ liệu mới.`
              : `Kích hoạt lại ngành ${row.original.code}?`
          }
          fields={[
            { name: "major_id", value: row.original.id },
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
          tooltip={row.original.is_active ? "Tạm ngưng ngành" : "Kích hoạt ngành"}
          variant={row.original.is_active ? "outline" : "success"}
        />
      </div>
    ),
  }),
  ] as unknown as ColumnDef<MajorTableRow, unknown>[];
}

type MajorsTableProps = {
  data: MajorTableRow[];
  returnTo?: string;
};

export function MajorsTable({
  data,
  returnTo = "/admin/majors",
}: MajorsTableProps) {
  return (
    <DataTable
      columns={buildColumns(returnTo)}
      data={data}
      emptyDescription="Tạo ngành để phân tầng lớp sinh hoạt và môn học theo khoa."
      emptyTitle="Chưa có ngành nào"
    />
  );
}
