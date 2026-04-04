"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

type DataTableProps<TData> = {
  caption?: string;
  columns: ColumnDef<TData>[];
  data: TData[];
  emptyDescription: string;
  emptyTitle: string;
  initialPageSize?: number;
  pageSizeOptions?: number[];
};

function resolveAlignmentClassName(align?: "center" | "left" | "right") {
  if (align === "center") {
    return "text-center";
  }

  if (align === "right") {
    return "text-right";
  }

  return "text-left";
}

function resolveJustifyClassName(align?: "center" | "left" | "right") {
  if (align === "center") {
    return "justify-center";
  }

  if (align === "right") {
    return "justify-end";
  }

  return "justify-start";
}

export function DataTable<TData>({
  caption,
  columns,
  data,
  emptyDescription,
  emptyTitle,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50],
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: initialPageSize,
      },
    },
    state: {
      sorting,
    },
  });

  const hasRows = table.getRowModel().rows.length > 0;

  if (!hasRows) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />;
  }

  const pagination = table.getState().pagination;
  const pageRows = table.getRowModel().rows;
  const pageStart = data.length === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const pageEnd = pageRows.length
    ? pagination.pageIndex * pagination.pageSize + pageRows.length
    : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="app-table-shell">
        {caption ? (
          <div className="border-b border-border/70 bg-muted/22 px-4 py-3 text-sm text-muted-foreground">
            {caption}
          </div>
        ) : null}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className={cn(
                      resolveAlignmentClassName(
                        header.column.columnDef.meta?.align,
                      ),
                      header.column.columnDef.meta?.headerClassName,
                    )}
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : header.column.getCanSort() ? (
                          <button
                            className={cn(
                              "inline-flex w-full items-center gap-2 transition-colors hover:text-foreground",
                              resolveJustifyClassName(
                                header.column.columnDef.meta?.align,
                              ),
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                            type="button"
                          >
                            <span className="truncate">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                            </span>
                            {header.column.getIsSorted() === "asc" ? (
                              <ArrowUpIcon aria-hidden="true" className="size-3.5" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ArrowDownIcon aria-hidden="true" className="size-3.5" />
                            ) : (
                              <ArrowUpDownIcon
                                aria-hidden="true"
                                className="size-3.5 opacity-50"
                              />
                            )}
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    className={cn(
                      resolveAlignmentClassName(cell.column.columnDef.meta?.align),
                      cell.column.columnDef.meta?.cellClassName,
                    )}
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5">
          <span className="app-status-dot bg-primary" />
          Hiển thị {pageStart}-{pageEnd} / {data.length} bản ghi. Trang{" "}
          {pagination.pageIndex + 1} / {table.getPageCount()}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="app-native-select min-w-[7rem]"
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            value={pagination.pageSize}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / trang
              </option>
            ))}
          </select>
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            size="sm"
            type="button"
            variant="outline"
          >
            <ChevronLeftIcon data-icon="inline-start" />
            Trước
          </Button>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            size="sm"
            type="button"
            variant="outline"
          >
            Sau
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  );
}
