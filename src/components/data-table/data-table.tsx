"use client";
"use no memo";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DataTableProps<TData> = {
  caption?: string;
  columns: ColumnDef<TData>[];
  data: TData[];
  emptyAction?: React.ReactNode;
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

function resolveAriaSort(
  sortingState: false | "asc" | "desc",
): "none" | "ascending" | "descending" {
  if (sortingState === "asc") {
    return "ascending";
  }

  if (sortingState === "desc") {
    return "descending";
  }

  return "none";
}

export function DataTable<TData>({
  caption,
  columns,
  data,
  emptyAction,
  emptyDescription,
  emptyTitle,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
}: DataTableProps<TData>) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(620);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  const pageSizeSelectId = useId();
  const pagination = table.getState().pagination;
  const pageRows = table.getRowModel().rows;
  const hasRows = pageRows.length > 0;
  const pageStart = data.length === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const pageEnd = pageRows.length
    ? pagination.pageIndex * pagination.pageSize + pageRows.length
    : 0;

  const shouldVirtualize = pageRows.length > 100;
  const rowHeight = 52;

  useEffect(() => {
    if (!shouldVirtualize || !containerRef.current) {
      return;
    }

    const element = containerRef.current;

    const updateDimensions = () => {
      setContainerHeight(element.clientHeight);
      setScrollTop(element.scrollTop);
    };

    updateDimensions();

    element.addEventListener("scroll", updateDimensions);
    window.addEventListener("resize", updateDimensions);

    return () => {
      element.removeEventListener("scroll", updateDimensions);
      window.removeEventListener("resize", updateDimensions);
    };
  }, [shouldVirtualize, pageRows.length]);

  const { bottomSpacer, topSpacer, visibleRows } = useMemo(() => {
    if (!shouldVirtualize) {
      return {
        topSpacer: 0,
        bottomSpacer: 0,
        visibleRows: pageRows,
      };
    }

    const safeHeight = containerHeight > 0 ? containerHeight : 620;
    const buffer = 8;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
    const visibleCount = Math.ceil(safeHeight / rowHeight) + buffer * 2;
    const endIndex = Math.min(pageRows.length, startIndex + visibleCount);

    return {
      topSpacer: startIndex * rowHeight,
      bottomSpacer: Math.max(0, (pageRows.length - endIndex) * rowHeight),
      visibleRows: pageRows.slice(startIndex, endIndex),
    };
  }, [containerHeight, pageRows, scrollTop, shouldVirtualize]);

  const columnCount = table.getVisibleLeafColumns().length;

  if (!hasRows) {
    return (
      <EmptyState
        action={
          emptyAction ?? (
            <Button onClick={() => router.refresh()} type="button" variant="secondary">
              <RotateCcwIcon className="size-4" data-icon="inline-start" />
              Tải lại dữ liệu
            </Button>
          )
        }
        description={emptyDescription}
        title={emptyTitle}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="app-table-shell">
        {caption ? (
          <div className="border-b border-border bg-muted px-4 py-3 text-xs text-muted-foreground">
            {caption}
          </div>
        ) : null}
        <div
          className={cn(
            "app-scrollbar relative w-full overflow-auto",
            shouldVirtualize ? "max-h-[620px]" : "max-h-[40rem]",
          )}
          ref={containerRef}
        >
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr className="border-b border-border" key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      aria-sort={
                        header.column.getCanSort()
                          ? resolveAriaSort(header.column.getIsSorted())
                          : undefined
                      }
                      className={cn(
                        "sticky top-0 z-10 h-12 bg-card px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase",
                        resolveAlignmentClassName(header.column.columnDef.meta?.align),
                        header.column.columnDef.meta?.headerClassName,
                      )}
                      key={header.id}
                      scope="col"
                    >
                      {header.isPlaceholder
                        ? null
                        : header.column.getCanSort() ? (
                            <button
                              className={cn(
                                "inline-flex h-9 w-full items-center gap-2 px-1 text-left",
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
                                <ArrowUpDownIcon aria-hidden="true" className="size-3.5 opacity-60" />
                              )}
                            </button>
                          ) : (
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {shouldVirtualize && topSpacer > 0 ? (
                <tr>
                  <td colSpan={columnCount} style={{ height: `${topSpacer}px` }} />
                </tr>
              ) : null}
              {visibleRows.map((row) => (
                <tr
                  className="border-b border-border odd:bg-card even:bg-slate-50/60 hover:bg-blue-50/70"
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      className={cn(
                        "px-3 py-3 text-sm text-foreground",
                        resolveAlignmentClassName(cell.column.columnDef.meta?.align),
                        cell.column.columnDef.meta?.cellClassName,
                      )}
                      key={cell.id}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {shouldVirtualize && bottomSpacer > 0 ? (
                <tr>
                  <td colSpan={columnCount} style={{ height: `${bottomSpacer}px` }} />
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <span className="app-status-dot bg-primary" />
          Hiển thị {pageStart}-{pageEnd} / {data.length} bản ghi. Trang {pagination.pageIndex + 1} /
          {" "}
          {table.getPageCount()}
          {shouldVirtualize ? " • Chế độ danh sách lớn" : ""}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={pageSizeSelectId}>
            Số dòng mỗi trang
          </label>
          <select
            className="app-native-select min-w-[7rem]"
            id={pageSizeSelectId}
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
            <ChevronLeftIcon className="size-4" data-icon="inline-start" />
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
            <ChevronRightIcon className="size-4" data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  );
}
