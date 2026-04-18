"use client";

import { CheckIcon, LockIcon, LockOpenIcon } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { transitionGradeStatusFormAction } from "@/features/admin-grades/actions";
import type { AdminGradeReviewRow } from "@/features/admin-grades/queries";
import { formatDateTime, formatScore } from "@/lib/format";

const columnHelper = createColumnHelper<AdminGradeReviewRow>();

function buildColumns(returnTo: string) {
  return [
  columnHelper.display({
    header: "Sinh viên",
    id: "student",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">
          {row.original.student_code} - {row.original.student_name}
        </span>
        <span className="text-xs text-muted-foreground">
          {row.original.semester_code} | Nhóm {row.original.section_code}
        </span>
      </div>
    ),
  }),
  columnHelper.display({
    header: "Học phần",
    id: "course",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.course_code}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.course_name}
        </span>
      </div>
    ),
  }),
  columnHelper.display({
    header: "Điểm thành phần",
    id: "components",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        CC {formatScore(row.original.attendance_score)} | GK{" "}
        {formatScore(row.original.midterm_score)} | CK{" "}
        {formatScore(row.original.final_score)}
      </div>
    ),
  }),
  columnHelper.display({
    header: "Tổng",
    id: "summary",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{formatScore(row.original.total_score)}</span>
        <span className="text-xs text-muted-foreground">
                {row.original.letter_grade ?? "Chưa có"} | GPA {formatScore(row.original.gpa_value)}
        </span>
      </div>
    ),
    meta: {
      align: "right",
    },
  }),
  columnHelper.accessor("status", {
    cell: (info) => <StatusBadge value={info.getValue()} />,
    header: "Trạng thái",
  }),
  columnHelper.accessor("updated_at", {
    cell: (info) => formatDateTime(info.getValue()),
    header: "Cập nhật",
    meta: {
      headerClassName: "min-w-40",
    },
  }),
  columnHelper.display({
    header: "Thao tác",
    id: "actions",
    meta: {
      align: "right",
      cellClassName: "min-w-32",
      headerClassName: "min-w-28",
    },
    cell: ({ row }) => (
      <div className="flex flex-col items-end gap-2">
        {row.original.status === "SUBMITTED" ? (
          <form action={transitionGradeStatusFormAction}>
            <input name="grade_id" type="hidden" value={row.original.grade_id} />
            <input name="next_status" type="hidden" value="APPROVED" />
            <input name="return_to" type="hidden" value={returnTo} />
            <Button size="sm" type="submit">
              <CheckIcon data-icon="inline-start" />
              Duyệt
            </Button>
          </form>
        ) : null}
        {row.original.status === "APPROVED" ? (
          <form action={transitionGradeStatusFormAction}>
            <input name="grade_id" type="hidden" value={row.original.grade_id} />
            <input name="next_status" type="hidden" value="LOCKED" />
            <input name="return_to" type="hidden" value={returnTo} />
            <Button size="sm" type="submit" variant="outline">
              <LockIcon data-icon="inline-start" />
              Khóa
            </Button>
          </form>
        ) : null}
        {row.original.status === "LOCKED" ? (
          <form action={transitionGradeStatusFormAction}>
            <input name="grade_id" type="hidden" value={row.original.grade_id} />
            <input name="next_status" type="hidden" value="APPROVED" />
            <input name="return_to" type="hidden" value={returnTo} />
            <Button size="sm" type="submit" variant="secondary">
              <LockOpenIcon data-icon="inline-start" />
              Mở khóa
            </Button>
          </form>
        ) : null}
      </div>
    ),
  }),
  ] as ColumnDef<AdminGradeReviewRow, unknown>[];
}

export function AdminGradesTable({
  data,
  returnTo = "/admin/grades",
}: {
  data: AdminGradeReviewRow[];
  returnTo?: string;
}) {
  return (
    <DataTable
      columns={buildColumns(returnTo)}
      data={data}
      emptyDescription="Không có bản ghi điểm khớp với trạng thái đang lọc."
      emptyTitle="Không có dữ liệu điểm"
    />
  );
}
