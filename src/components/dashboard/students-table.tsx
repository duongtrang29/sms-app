"use client";

import { CircleOffIcon, PencilLineIcon, RotateCcwIcon } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { InlineActionForm } from "@/components/shared/inline-action-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActionLink } from "@/components/shared/table-action-button";
import { toggleStudentStatusFormAction } from "@/features/students/actions";
import { buildEditPath } from "@/lib/admin-routing";

type StudentTableRow = {
  access_status: string;
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
        <InlineActionForm
          action={toggleStudentStatusFormAction}
          confirmMessage={
            row.original.access_status === "ACTIVE"
              ? `Tạm ngưng tài khoản sinh viên ${row.original.student_code}?`
              : `Kích hoạt lại tài khoản sinh viên ${row.original.student_code}?`
          }
          fields={[
            { name: "student_id", value: row.original.id },
            {
              name: "next_status",
              value: row.original.access_status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
            },
            { name: "return_to", value: returnTo },
          ]}
          icon={
            row.original.access_status === "ACTIVE" ? (
              <CircleOffIcon aria-hidden="true" className="size-4" />
            ) : (
              <RotateCcwIcon aria-hidden="true" className="size-4" />
            )
          }
          iconOnly
          label={row.original.access_status === "ACTIVE" ? "Tạm ngưng" : "Kích hoạt"}
          pendingLabel="Đang cập nhật"
          tooltip={
            row.original.access_status === "ACTIVE"
              ? "Tạm ngưng tài khoản"
              : "Kích hoạt tài khoản"
          }
          variant={row.original.access_status === "ACTIVE" ? "outline" : "success"}
        />
      </div>
    ),
  }),
  ] as unknown as ColumnDef<StudentTableRow, unknown>[];
}

type StudentsTableProps = {
  data: StudentTableRow[];
  returnTo?: string;
};

export function StudentsTable({
  data,
  returnTo = "/admin/students",
}: StudentsTableProps) {
  return (
    <DataTable
      columns={buildColumns(returnTo)}
      data={data}
      emptyDescription="Tạo hoặc nhập sinh viên để bắt đầu thử luồng học vụ, đăng ký và điểm."
      emptyTitle="Chưa có sinh viên"
    />
  );
}
