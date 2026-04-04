"use client";

import { PencilLineIcon, Trash2Icon } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { InlineActionForm } from "@/components/shared/inline-action-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActionLink } from "@/components/shared/table-action-button";
import { deleteDepartmentFormAction } from "@/features/departments/actions";
import { buildEditPath } from "@/lib/admin-routing";
import type { Department } from "@/types/app";

const columnHelper = createColumnHelper<Department>();

function buildColumns(returnTo: string) {
  return [
  columnHelper.accessor("code", {
    header: "Mã khoa",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor("name", {
    header: "Tên khoa",
  }),
  columnHelper.accessor("is_active", {
    header: "Trạng thái",
    cell: (info) => (
      <StatusBadge value={info.getValue() ? "ACTIVE" : "INACTIVE"} />
    ),
  }),
  columnHelper.accessor("description", {
    header: "Mô tả",
    cell: (info) => info.getValue() ?? "Chưa có",
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
          label="Sửa khoa"
        />
        <InlineActionForm
          action={deleteDepartmentFormAction}
          confirmMessage={`Xóa khoa ${row.original.code}? Thao tác này chỉ nên dùng khi khoa chưa có dữ liệu phụ thuộc.`}
          fields={[
            { name: "department_id", value: row.original.id },
            { name: "return_to", value: returnTo },
          ]}
          icon={<Trash2Icon aria-hidden="true" className="size-4" />}
          iconOnly
          label="Xóa"
          pendingLabel="Đang xóa"
          tooltip="Xóa khoa"
          variant="destructive"
        />
      </div>
    ),
  }),
  ] as unknown as ColumnDef<Department, unknown>[];
}

type DepartmentsTableProps = {
  data: Department[];
  returnTo?: string;
};

export function DepartmentsTable({
  data,
  returnTo = "/admin/departments",
}: DepartmentsTableProps) {
  return (
    <DataTable
      columns={buildColumns(returnTo)}
      data={data}
      emptyDescription="Thêm khoa đầu tiên để bắt đầu cấu hình cấu trúc đào tạo."
      emptyTitle="Chưa có khoa nào"
    />
  );
}
