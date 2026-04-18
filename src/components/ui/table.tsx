"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="app-scrollbar relative w-full overflow-auto" data-slot="table-container">
      <table
        className={cn(
          "w-full min-w-[720px] caption-bottom text-sm",
          "[&_th:first-child]:sticky [&_th:first-child]:left-0 [&_th:first-child]:z-20 [&_th:first-child]:bg-card",
          "[&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:z-10 [&_td:first-child]:bg-inherit",
          className,
        )}
        data-slot="table"
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("[&_tr]:border-b [&_tr]:border-border", className)} data-slot="table-header" {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} data-slot="table-body" {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      className={cn("border-t border-border bg-muted font-medium", className)}
      data-slot="table-footer"
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-border odd:bg-card even:bg-slate-50/60 hover:bg-blue-50/70",
        className,
      )}
      data-slot="table-row"
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "sticky top-0 z-10 h-12 bg-card px-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase",
        className,
      )}
      data-slot="table-head"
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={cn("px-3 py-3 align-middle text-sm text-foreground", className)}
      data-slot="table-cell"
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption className={cn("mt-4 text-sm text-muted-foreground", className)} data-slot="table-caption" {...props} />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
