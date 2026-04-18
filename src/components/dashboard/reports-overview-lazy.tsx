"use client";

import dynamic from "next/dynamic";

import type {
  AcademicWarningPoint,
  ClassGpaPoint,
  CoursePassRatePoint,
  DepartmentDistributionPoint,
} from "@/features/reports/queries";

const ReportsOverview = dynamic(
  () =>
    import("@/components/dashboard/reports-overview").then(
      (module) => module.ReportsOverview,
    ),
  {
    loading: () => (
      <div className="app-subtle-surface p-6 text-caption text-muted-foreground">
        Đang tải biểu đồ báo cáo...
      </div>
    ),
    ssr: false,
  },
);

type ReportsOverviewLazyProps = {
  classGpa: ClassGpaPoint[];
  departmentDistribution: DepartmentDistributionPoint[];
  passRates: CoursePassRatePoint[];
  warnings: AcademicWarningPoint[];
};

export function ReportsOverviewLazy(props: ReportsOverviewLazyProps) {
  return <ReportsOverview {...props} />;
}
