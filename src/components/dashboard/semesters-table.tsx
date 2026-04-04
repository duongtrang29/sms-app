"use client";

import { PencilLineIcon, Trash2Icon } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { InlineActionForm } from "@/components/shared/inline-action-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActionLink } from "@/components/shared/table-action-button";
import { deleteSemesterFormAction } from "@/features/semesters/actions";
import { buildEditPath } from "@/lib/admin-routing";
import { formatDate } from "@/lib/format";
import type { Semester } from "@/types/app";

const columnHelper = createColumnHelper<Semester>();

function buildColumns(returnTo: string) {
  return [
  columnHelper.accessor("code", { header: "Mã" }),
  columnHelper.accessor("name", { header: "Học kỳ" }),
  columnHelper.accessor("academic_year", { header: "Năm học" }),
  columnHelper.accessor("start_date", {
    header: "Thời gian",
    cell: ({ row }) => `${formatDate(row.original.start_date)} - ${formatDate(row.original.end_date)}`,
  }),
  columnHelper.accessor("is_current", {
    header: "Hiện hành",
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
          label="Sửa học kỳ"
        />
        <InlineActionForm
          action={deleteSemesterFormAction}
          confirmMessage={`Xóa học kỳ ${row.original.code}? Chỉ nên xóa khi học kỳ chưa có học phần mở.`}
          fields={[
            { name: "semester_id", value: row.original.id },
            { name: "return_to", value: returnTo },
          ]}
          icon={<Trash2Icon aria-hidden="true" className="size-4" />}
          iconOnly
          label="Xóa"
          pendingLabel="Đang xóa"
          tooltip="Xóa học kỳ"
          variant="destructive"
        />
      </div>
    ),
  }),
  ] as unknown as ColumnDef<Semester, unknown>[];
}

export function SemestersTable({
  data,
  returnTo = "/admin/semesters",
}: {
  data: Semester[];
  returnTo?: string;
}) {
  return (
    <DataTable
      columns={buildColumns(returnTo)}
      data={data}
      emptyDescription="Tạo học kỳ để mở học phần, đăng ký môn và khóa mốc phúc khảo."
      emptyTitle="Chưa có học kỳ"
    />
  );
}
