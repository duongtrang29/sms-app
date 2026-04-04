"use client";

import { CircleOffIcon, PencilLineIcon, RotateCcwIcon } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { InlineActionForm } from "@/components/shared/inline-action-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActionLink } from "@/components/shared/table-action-button";
import { toggleLecturerStatusFormAction } from "@/features/lecturers/actions";
import { buildEditPath } from "@/lib/admin-routing";

type LecturerTableRow = {
  departmentName: string;
  email: string;
  employee_code: string;
  full_name: string;
  id: string;
  status: string;
};

const columnHelper = createColumnHelper<LecturerTableRow>();

function buildColumns(returnTo: string) {
  return [
  columnHelper.accessor("employee_code", {
    header: "Mã GV",
  }),
  columnHelper.accessor("full_name", {
    header: "Giảng viên",
  }),
  columnHelper.accessor("email", {
    header: "Email",
  }),
  columnHelper.accessor("departmentName", {
    header: "Khoa",
  }),
  columnHelper.accessor("status", {
    header: "Trạng thái",
    cell: (info) => <StatusBadge value={info.getValue()} />,
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
          label="Sửa giảng viên"
        />
        <InlineActionForm
          action={toggleLecturerStatusFormAction}
          confirmMessage={
            row.original.status === "ACTIVE"
              ? `Tạm ngưng tài khoản giảng viên ${row.original.employee_code}?`
              : `Kích hoạt lại tài khoản giảng viên ${row.original.employee_code}?`
          }
          fields={[
            { name: "lecturer_id", value: row.original.id },
            {
              name: "next_status",
              value: row.original.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
            },
            { name: "return_to", value: returnTo },
          ]}
          icon={
            row.original.status === "ACTIVE" ? (
              <CircleOffIcon aria-hidden="true" className="size-4" />
            ) : (
              <RotateCcwIcon aria-hidden="true" className="size-4" />
            )
          }
          iconOnly
          label={row.original.status === "ACTIVE" ? "Tạm ngưng" : "Kích hoạt"}
          pendingLabel="Đang cập nhật"
          tooltip={
            row.original.status === "ACTIVE"
              ? "Tạm ngưng tài khoản"
              : "Kích hoạt tài khoản"
          }
          variant={row.original.status === "ACTIVE" ? "outline" : "success"}
        />
      </div>
    ),
  }),
  ] as unknown as ColumnDef<LecturerTableRow, unknown>[];
}

type LecturersTableProps = {
  data: LecturerTableRow[];
  returnTo?: string;
};

export function LecturersTable({
  data,
  returnTo = "/admin/lecturers",
}: LecturersTableProps) {
  return (
    <DataTable
      columns={buildColumns(returnTo)}
      data={data}
      emptyDescription="Tạo giảng viên để gán học phần, lịch dạy và nhập điểm."
      emptyTitle="Chưa có giảng viên"
    />
  );
}
