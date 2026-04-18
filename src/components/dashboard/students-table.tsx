"use client";

import { PencilLineIcon } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import {
  DataTable,
  type ServerPaginationConfig,
} from "@/components/data-table/data-table";
import { StudentStatusToggleButton } from "@/components/dashboard/student-status-toggle-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActionLink } from "@/components/shared/table-action-button";
import { buildEditPath } from "@/lib/admin-routing";

type StudentTableRow = {
  access_status: "ACTIVE" | "INACTIVE" | "LOCKED";
  academic_class_code: string;
  current_status: string;
  full_name: string;
  id: string;
  student_code: string;
};

const columnHelper = createColumnHelper<StudentTableRow>();

function buildColumns(returnTo: string) {
  return [
  columnHelper.accessor("student_code", {
    header: "MSSV",
  }),
  columnHelper.accessor("full_name", {
    header: "Sinh viên",
  }),
  columnHelper.accessor("academic_class_code", {
    header: "Lớp",
  }),
  columnHelper.accessor("current_status", {
    header: "Học tập",
    cell: (info) => <StatusBadge value={info.getValue()} />,
  }),
  columnHelper.accessor("access_status", {
    header: "Truy cập",
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
          label="Sửa sinh viên"
        />
        <StudentStatusToggleButton
          status={row.original.access_status}
          studentCode={row.original.student_code}
          studentId={row.original.id}
        />
      </div>
    ),
  }),
  ] as unknown as ColumnDef<StudentTableRow, unknown>[];
}

type StudentsTableProps = {
  data: StudentTableRow[];
  returnTo?: string;
  serverPagination?: ServerPaginationConfig | undefined;
};

export function StudentsTable({
  data,
  returnTo = "/admin/students",
  serverPagination,
}: StudentsTableProps) {
  return (
    <DataTable
      columns={buildColumns(returnTo)}
      data={data}
      emptyDescription="Tạo hoặc nhập sinh viên để bắt đầu thử luồng học vụ, đăng ký và điểm."
      emptyTitle="Chưa có sinh viên"
      serverPagination={serverPagination}
    />
  );
}
