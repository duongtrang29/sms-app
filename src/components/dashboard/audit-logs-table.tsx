"use client";

import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import type { AuditLogListItem } from "@/features/audit-logs/queries";
import {
  getAuditActionLabel,
  getAuditEntityLabel,
  getAuditModeLabel,
  getAuditRoleLabel,
} from "@/lib/audit-presentation";
import { formatDateTime } from "@/lib/format";

const columnHelper = createColumnHelper<AuditLogListItem>();

const columns = [
  columnHelper.accessor("created_at", {
    cell: (info) => formatDateTime(info.getValue()),
    header: "Thời gian",
    meta: {
      headerClassName: "min-w-40",
    },
  }),
  columnHelper.display({
    header: "Tác nhân",
    id: "actor",
    cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.original.actor_name ?? "Hệ thống / Không rõ"}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.actor_email ?? getAuditRoleLabel(row.original.actor_role)}
          </span>
        </div>
      ),
  }),
  columnHelper.accessor("actor_role", {
    cell: (info) =>
      info.getValue() ? (
        <Badge variant="secondary">{getAuditRoleLabel(info.getValue())}</Badge>
      ) : (
        "Chưa có"
      ),
    header: "Vai trò",
  }),
  columnHelper.accessor("action", {
    cell: (info) => getAuditActionLabel(info.getValue()),
    header: "Thao tác",
  }),
  columnHelper.display({
    header: "Đối tượng",
    id: "entity",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">
          {getAuditEntityLabel(row.original.entity_type)}
        </span>
        <span className="text-xs text-muted-foreground">
          {row.original.entity_id ?? "Chưa có"}
        </span>
      </div>
    ),
  }),
  columnHelper.display({
    header: "Người nhận tác động",
    id: "target",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.target_name ?? "Chưa có"}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.target_email ?? "Không có"}
        </span>
      </div>
    ),
  }),
  columnHelper.display({
    header: "Siêu dữ liệu",
    id: "metadata",
    cell: ({ row }) => (
      <span className="line-clamp-2 whitespace-normal text-xs leading-5 text-muted-foreground">
        {JSON.stringify(row.original.metadata)}
      </span>
    ),
    meta: {
      cellClassName: "max-w-xl whitespace-normal",
      headerClassName: "min-w-48",
    },
  }),
  columnHelper.accessor("is_demo", {
    cell: (info) => (
      <Badge variant={info.getValue() ? "outline" : "secondary"}>
        {getAuditModeLabel(info.getValue())}
      </Badge>
    ),
    header: "Nguồn dữ liệu",
  }),
] as ColumnDef<AuditLogListItem, unknown>[];

export function AuditLogsTable({ data }: { data: AuditLogListItem[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyDescription="Chưa có thao tác nào khớp với bộ lọc hiện tại."
      emptyTitle="Không có nhật ký phù hợp"
    />
  );
}
