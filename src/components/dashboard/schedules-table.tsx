"use client";

import { PencilLineIcon } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { TableActionLink } from "@/components/shared/table-action-button";
import { weekdayLabel } from "@/lib/format";

type ScheduleTableRow = {
  day_of_week: number;
  id: string;
  offeringName: string;
  roomName: string;
  timeRange: string;
};

const columnHelper = createColumnHelper<ScheduleTableRow>();

const columns = [
  columnHelper.accessor("offeringName", { header: "Học phần" }),
  columnHelper.accessor("day_of_week", { header: "Thứ", cell: (info) => weekdayLabel(info.getValue()) }),
  columnHelper.accessor("timeRange", { header: "Khung giờ" }),
  columnHelper.accessor("roomName", { header: "Phòng" }),
  columnHelper.display({
    id: "actions",
    header: "Thao tác",
    meta: {
      align: "right",
      cellClassName: "w-16",
      headerClassName: "w-16",
    },
    cell: ({ row }) => (
      <div className="flex justify-end">
        <TableActionLink
          href={`/admin/schedules?edit=${row.original.id}`}
          icon={<PencilLineIcon aria-hidden="true" className="size-4" />}
          label="Sửa lịch học"
        />
      </div>
    ),
  }),
] as unknown as ColumnDef<ScheduleTableRow, unknown>[];

export function SchedulesTable({ data }: { data: ScheduleTableRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyDescription="Tạo lịch học để sinh viên và giảng viên có thể xem thời khóa biểu."
      emptyTitle="Chưa có lịch học"
    />
  );
}
