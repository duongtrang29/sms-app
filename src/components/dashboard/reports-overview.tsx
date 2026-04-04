"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/shared/empty-state";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  AcademicWarningPoint,
  ClassGpaPoint,
  CoursePassRatePoint,
  DepartmentDistributionPoint,
} from "@/features/reports/queries";
import { formatScore } from "@/lib/format";

type ReportsOverviewProps = {
  classGpa: ClassGpaPoint[];
  departmentDistribution: DepartmentDistributionPoint[];
  passRates: CoursePassRatePoint[];
  warnings: AcademicWarningPoint[];
};

const departmentChartConfig = {
  total_students: {
    color: "hsl(var(--chart-1))",
    label: "Sinh viên",
  },
};

const passRateChartConfig = {
  pass_rate: {
    color: "hsl(var(--chart-2))",
    label: "Tỷ lệ đạt",
  },
};

const gpaChartConfig = {
  average_gpa4: {
    color: "hsl(var(--chart-3))",
    label: "GPA hệ 4",
  },
};

export function ReportsOverview({
  classGpa,
  departmentDistribution,
  passRates,
  warnings,
}: ReportsOverviewProps) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Phân bổ sinh viên theo khoa</CardTitle>
            <CardDescription>
              Tổng hợp từ cấu trúc khoa, ngành và lớp sinh hoạt hiện có.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {departmentDistribution.length ? (
              <ChartContainer
                className="h-72 w-full"
                config={departmentChartConfig}
              >
                <BarChart
                  accessibilityLayer
                  data={departmentDistribution}
                  layout="vertical"
                  margin={{ left: 12, right: 12 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis dataKey="total_students" type="number" />
                  <YAxis
                    dataKey="department_name"
                    type="category"
                    width={120}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="total_students"
                    fill="var(--color-total_students)"
                    radius={6}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState
                description="Chưa có đủ dữ liệu sinh viên để tạo phân tích."
                title="Không có dữ liệu biểu đồ"
              />
            )}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Tỷ lệ đạt theo môn</CardTitle>
            <CardDescription>
              Chỉ tính các học phần đã có điểm duyệt hoặc đã khóa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {passRates.length ? (
              <ChartContainer className="h-72 w-full" config={passRateChartConfig}>
                <BarChart
                  accessibilityLayer
                  data={passRates}
                  margin={{ left: 12, right: 12 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey="course_code"
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    tickLine={false}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="pass_rate"
                    fill="var(--color-pass_rate)"
                    radius={6}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState
                description="Chưa có đủ dữ liệu điểm để tính tỷ lệ đạt."
                title="Không có dữ liệu biểu đồ"
              />
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>GPA trung bình theo lớp</CardTitle>
            <CardDescription>
              Ưu tiên các lớp có dữ liệu GPA học kỳ rõ ràng để rà soát học vụ.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classGpa.length ? (
              <ChartContainer className="h-80 w-full" config={gpaChartConfig}>
                <BarChart
                  accessibilityLayer
                  data={classGpa}
                  margin={{ left: 12, right: 12 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey="class_code"
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    domain={[0, 4]}
                    tickLine={false}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="average_gpa4"
                    fill="var(--color-average_gpa4)"
                    radius={6}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState
                description="Chưa có điểm đã duyệt đủ để tính GPA trung bình theo lớp."
                title="Không có dữ liệu biểu đồ"
              />
            )}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Sinh viên cảnh báo học vụ</CardTitle>
            <CardDescription>
              Các trường hợp GPA tích lũy dưới ngưỡng cảnh báo hiện tại.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {warnings.length ? (
              warnings.slice(0, 10).map((warning) => (
                <div
                  key={warning.student_id}
                  className="app-subtle-surface p-4"
                >
                  <div className="font-medium">
                    {warning.student_code} - {warning.student_name}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {warning.class_code} | GPA 4: {formatScore(warning.cumulative_gpa4)} | GPA 10:{" "}
                    {formatScore(warning.cumulative_score10)}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Tín chỉ hoàn thành: {warning.completed_credits}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                description="Hiện chưa có sinh viên nằm trong diện cảnh báo học vụ."
                title="Không có cảnh báo"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
