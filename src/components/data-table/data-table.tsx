"use client";
"use no memo";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  InboxIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type ServerPaginationConfig = {
  page: number;
  pageCount: number;
  pageParam?: string;
  pageSize: number;
  pathname: string;
  query?: Record<string, string>;
  total: number;
};

type DataTableProps<TData> = {
  bulkActions?: ((selectedRows: TData[], clearSelection: () => void) => React.ReactNode) | undefined;
  caption?: string;
  columns: ColumnDef<TData>[];
  data: TData[];
  emptyAction?: React.ReactNode;
  emptyDescription: string;
  emptyTitle: string;
  enableRowSelection?: boolean;
  initialPageSize?: number;
  isLoading?: boolean;
  pageSizeOptions?: number[];
  serverPagination?: ServerPaginationConfig | undefined;
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

function buildVisiblePages(currentPage: number, pageCount: number) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5];
  }

  if (currentPage >= pageCount - 2) {
    return [pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }

  return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
}

function SkeletonTable({ columnCount, rowCount = 5 }: { columnCount: number; rowCount?: number }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="table-scroll w-full overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-0">
          <thead>
            <tr>
              {Array.from({ length: columnCount }).map((_, index) => (
                <th className="h-12 border-b border-border bg-card px-3 text-left" key={`skeleton-head-${index}`}>
                  <Skeleton className="h-4 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <tr className="h-[52px] border-b border-border" key={`skeleton-row-${rowIndex}`}>
                {Array.from({ length: columnCount }).map((__, columnIndex) => (
                  <td className="px-3 py-2" key={`skeleton-cell-${rowIndex}-${columnIndex}`}>
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DataTable<TData>({
  bulkActions,
  caption,
  columns,
  data,
  emptyAction,
  emptyDescription,
  emptyTitle,
  enableRowSelection = false,
  initialPageSize = 10,
  isLoading = false,
  pageSizeOptions = [10, 20, 50, 100],
  serverPagination,
}: DataTableProps<TData>) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const isServerPagination = Boolean(serverPagination);

  const selectionColumn = useMemo<ColumnDef<TData>>(
    () => ({
      id: "_select",
      enableSorting: false,
      meta: {
        align: "center",
      },
      header: ({ table }) => (
        <input
          aria-label="Chọn tất cả"
          checked={table.getIsAllPageRowsSelected()}
          className="size-4 rounded border-input accent-primary"
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          type="checkbox"
        />
      ),
      cell: ({ row }) => (
        <input
          aria-label="Chọn dòng"
          checked={row.getIsSelected()}
          className="size-4 rounded border-input accent-primary"
          onChange={row.getToggleSelectedHandler()}
          type="checkbox"
        />
      ),
    }),
    [],
  );

  const tableColumns = useMemo<ColumnDef<TData>[]>(() => {
    if (!enableRowSelection) {
      return columns;
    }

    return [selectionColumn, ...columns];
  }, [columns, enableRowSelection, selectionColumn]);

  const table = useReactTable({
    columns: tableColumns,
    data,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    ...(isServerPagination
      ? {
          manualPagination: true,
          pageCount: serverPagination?.pageCount ?? 1,
        }
      : {
          getPaginationRowModel: getPaginationRowModel(),
          manualPagination: false,
        }),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: isServerPagination ? Math.max(data.length, 1) : initialPageSize,
      },
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: {
      rowSelection,
      sorting,
    },
  });

  const pageSizeSelectId = useId();
  const pagination = table.getState().pagination;
  const pageRows = table.getRowModel().rows;
  const hasRows = pageRows.length > 0;
  const pageCount = isServerPagination
    ? Math.max(1, serverPagination?.pageCount ?? 1)
    : Math.max(1, table.getPageCount());
  const currentPage = isServerPagination
    ? Math.max(1, serverPagination?.page ?? 1)
    : pagination.pageIndex + 1;
  const totalRows = isServerPagination ? serverPagination?.total ?? 0 : data.length;
  const effectivePageSize = isServerPagination
    ? Math.max(1, serverPagination?.pageSize ?? 1)
    : pagination.pageSize;
  const pageStart = totalRows === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1;
  const pageEnd = totalRows === 0 ? 0 : Math.min(currentPage * effectivePageSize, totalRows);
  const visiblePages = buildVisiblePages(currentPage, pageCount);
  const canNextPage = isServerPagination ? currentPage < pageCount : table.getCanNextPage();
  const canPreviousPage = isServerPagination ? currentPage > 1 : table.getCanPreviousPage();
  const showPageSizeSelect = !isServerPagination && totalRows > (pageSizeOptions[0] ?? initialPageSize);
  const showPagination = pageCount > 1;
  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
  const columnCount = table.getVisibleLeafColumns().length || tableColumns.length;
  const serverPageParam = serverPagination?.pageParam ?? "page";

  function buildServerPageHref(page: number) {
    if (!serverPagination) {
      return "#";
    }

    const params = new URLSearchParams(serverPagination.query ?? {});
    params.set(serverPageParam, String(page));
    const queryString = params.toString();

    return queryString
      ? `${serverPagination.pathname}?${queryString}`
      : serverPagination.pathname;
  }

  const clearSelection = () => setRowSelection({});

  if (isLoading) {
    return <SkeletonTable columnCount={columnCount || 1} />;
  }

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
        icon={<InboxIcon className="size-5" />}
        title={emptyTitle}
      />
    );
  }

  return (
    <div className="relative flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-card">
        {caption ? (
          <div className="border-b border-border bg-muted px-4 py-3 text-xs text-muted-foreground">
            {caption}
          </div>
        ) : null}

        <div className="table-scroll relative max-h-[40rem] w-full overflow-auto">
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
                                "inline-flex min-h-[44px] w-full items-center gap-2 px-1 text-left",
                                resolveJustifyClassName(header.column.columnDef.meta?.align),
                              )}
                              onClick={header.column.getToggleSortingHandler()}
                              type="button"
                            >
                              <span className="truncate">
                                {flexRender(header.column.columnDef.header, header.getContext())}
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
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr
                  className={cn(
                    "h-[52px] border-b border-border odd:bg-card even:bg-muted/35",
                    row.getIsSelected() && "bg-accent/70",
                  )}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      className={cn(
                        "px-3 py-2 text-sm text-foreground",
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
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="inline-flex min-h-[36px] items-center rounded-md border border-border bg-muted/35 px-3 py-2">
          Hiển thị {pageStart}-{pageEnd} / {totalRows} bản ghi
        </div>

        {showPageSizeSelect || showPagination ? (
          <div className="flex flex-wrap items-center gap-3">
            {showPageSizeSelect ? (
              <>
                <label className="sr-only" htmlFor={pageSizeSelectId}>
                  Số dòng mỗi trang
                </label>
                <select
                  className="app-native-select min-w-[7.5rem]"
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
              </>
            ) : null}

            {showPagination ? (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      className={cn(!canPreviousPage && "pointer-events-none opacity-50")}
                      href={
                        isServerPagination
                          ? buildServerPageHref(Math.max(1, currentPage - 1))
                          : "#"
                      }
                      onClick={
                        isServerPagination
                          ? undefined
                          : (event) => {
                              event.preventDefault();
                              if (!canPreviousPage) {
                                return;
                              }
                              table.previousPage();
                            }
                      }
                    />
                  </PaginationItem>
                  {visiblePages.map((page) => (
                    <PaginationItem key={`page-${page}`}>
                      <PaginationLink
                        href={isServerPagination ? buildServerPageHref(page) : "#"}
                        isActive={page === currentPage}
                        onClick={
                          isServerPagination
                            ? undefined
                            : (event) => {
                                event.preventDefault();
                                table.setPageIndex(page - 1);
                              }
                        }
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      className={cn(!canNextPage && "pointer-events-none opacity-50")}
                      href={
                        isServerPagination
                          ? buildServerPageHref(Math.min(pageCount, currentPage + 1))
                          : "#"
                      }
                      onClick={
                        isServerPagination
                          ? undefined
                          : (event) => {
                              event.preventDefault();
                              if (!canNextPage) {
                                return;
                              }
                              table.nextPage();
                            }
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : null}
          </div>
        ) : null}
      </div>

      {enableRowSelection && selectedRows.length > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex min-h-[52px] w-full max-w-xl items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-dropdown)]">
            <div className="text-sm text-muted-foreground">Đã chọn {selectedRows.length} bản ghi</div>
            <div className="flex items-center gap-2">
              {bulkActions ? bulkActions(selectedRows, clearSelection) : null}
              <Button onClick={clearSelection} size="sm" type="button" variant="outline">
                Bỏ chọn
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
