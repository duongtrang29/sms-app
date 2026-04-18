"use client";

import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import type {
  AcademicWarningPoint,
  ClassGpaPoint,
  CoursePassRatePoint,
  DepartmentDistributionPoint,
} from "@/features/reports/queries";

type ReportsExportButtonProps = {
  classGpa: ClassGpaPoint[];
  departmentDistribution: DepartmentDistributionPoint[];
  passRates: CoursePassRatePoint[];
  warnings: AcademicWarningPoint[];
};

export function ReportsExportButton({
  classGpa,
  departmentDistribution,
  passRates,
  warnings,
}: ReportsExportButtonProps) {
  return (
    <Button
      onClick={() => {
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(departmentDistribution),
          "StudentDistribution",
        );
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(passRates),
          "CoursePassRate",
        );
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(classGpa),
          "ClassGPA",
        );
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(warnings),
          "AcademicWarnings",
        );

        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
        XLSX.writeFile(workbook, `admin-reports-${timestamp}.xlsx`);
      }}
      type="button"
      variant="outline"
    >
      Export Excel
    </Button>
  );
}

