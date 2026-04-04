"use client";

import { CircleOffIcon, PencilLineIcon, RotateCcwIcon } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { InlineActionForm } from "@/components/shared/inline-action-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActionLink } from "@/components/shared/table-action-button";
import { toggleRoomStatusFormAction } from "@/features/rooms/actions";
import { buildEditPath } from "@/lib/admin-routing";
import type { Room } from "@/types/app";

const columnHelper = createColumnHelper<Room>();

function buildColumns(returnTo: string) {
  return [
  columnHelper.accessor("code", { header: "Mã phòng" }),
  columnHelper.accessor("name", { header: "Tên phòng" }),
  columnHelper.accessor("building", {
    header: "Tòa nhà",
    cell: (info) => info.getValue() ?? "Chưa có",
  }),
  columnHelper.accessor("capacity", {
    header: "Sức chứa",
    meta: {
      align: "right",
    },
  }),
  columnHelper.accessor("is_active", { header: "Trạng thái", cell: (info) => <StatusBadge value={info.getValue() ? "ACTIVE" : "INACTIVE"} /> }),
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
          label="Sửa phòng học"
        />
        <InlineActionForm
          action={toggleRoomStatusFormAction}
          confirmMessage={
            row.original.is_active
              ? `Tạm ngưng phòng ${row.original.code}? Phòng sẽ không còn được dùng để xếp lịch mới.`
              : `Kích hoạt lại phòng ${row.original.code}?`
          }
          fields={[
            { name: "room_id", value: row.original.id },
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
          tooltip={
            row.original.is_active ? "Tạm ngưng phòng học" : "Kích hoạt phòng học"
          }
          variant={row.original.is_active ? "outline" : "success"}
        />
      </div>
    ),
  }),
  ] as unknown as ColumnDef<Room, unknown>[];
}

export function RoomsTable({
  data,
  returnTo = "/admin/rooms",
}: {
  data: Room[];
  returnTo?: string;
}) {
  return (
    <DataTable
      columns={buildColumns(returnTo)}
      data={data}
      emptyDescription="Tạo phòng học để gắn lịch học và kiểm tra trùng phòng."
      emptyTitle="Chưa có phòng học"
    />
  );
}
