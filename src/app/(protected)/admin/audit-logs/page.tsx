import { AuditLogsTable } from "@/components/dashboard/audit-logs-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { FormPanelCard } from "@/components/forms/form-container";
import { listAuditLogs } from "@/features/audit-logs/queries";
import {
  getAuditActionLabel,
  getAuditRoleLabel,
} from "@/lib/audit-presentation";

type AuditLogsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function AuditLogsPage({
  searchParams,
}: AuditLogsPageProps) {
  const resolvedSearchParams = await searchParams;
  const action = getSingleParam(resolvedSearchParams, "action");
  const demo = getSingleParam(resolvedSearchParams, "demo") as
    | ""
    | "all"
    | "demo"
    | "live";
  const query = getSingleParam(resolvedSearchParams, "q");
  const role = getSingleParam(resolvedSearchParams, "role");

  const filters = {
    ...(action ? { action } : {}),
    demo: demo || "all",
    ...(query ? { query } : {}),
    ...(role ? { role } : {}),
  };
  const snapshot = await listAuditLogs(filters);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Theo dõi các thao tác nhạy cảm trên hệ thống để kiểm tra phân quyền, truy vết thay đổi và đối chiếu dữ liệu minh họa với dữ liệu thật."
        title="Nhật ký hệ thống"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          description="Tổng số sự kiện đã ghi nhận"
          label="Tổng sự kiện"
          value={snapshot.summary.totalEvents}
        />
        <StatCard
          description="Sự kiện phát sinh trong hôm nay theo múi giờ máy chủ"
          label="Hôm nay"
          value={snapshot.summary.todayEvents}
        />
        <StatCard
          description="Các sự kiện liên quan xác thực"
          label="Sự kiện xác thực"
          value={snapshot.summary.authEvents}
        />
        <StatCard
          description="Sự kiện thuộc nhóm dữ liệu minh họa"
          label="Sự kiện minh họa"
          value={snapshot.summary.demoEvents}
        />
        <StatCard
          description="Sự kiện thuộc dữ liệu thật"
          label="Sự kiện dữ liệu thật"
          value={snapshot.summary.liveEvents}
        />
      </div>
      <FormPanelCard
        description="Tìm theo thao tác, vai trò, nguồn dữ liệu và từ khóa trong siêu dữ liệu."
        title="Bộ lọc nhật ký"
      >
        <FilterToolbar
          key={`${query}|${action}|${role}|${demo}`}
          searchPlaceholder="Tìm thao tác, đối tượng, siêu dữ liệu"
          searchValue={query}
          selects={[
            {
              key: "action",
              label: "Thao tác",
              options: snapshot.availableActions.map((item) => ({
                label: getAuditActionLabel(item),
                value: item,
              })),
              placeholder: "Tất cả thao tác",
            },
            {
              key: "role",
              label: "Vai trò",
              options: snapshot.availableRoles.map((item) => ({
                label: getAuditRoleLabel(item),
                value: item,
              })),
              placeholder: "Tất cả vai trò",
            },
            {
              key: "demo",
              label: "Nguồn dữ liệu",
              options: [
                { label: "Minh họa + dữ liệu thật", value: "all" },
                { label: "Chỉ minh họa", value: "demo" },
                { label: "Chỉ dữ liệu thật", value: "live" },
              ],
              placeholder: "Minh họa + dữ liệu thật",
            },
          ]}
        />
      </FormPanelCard>
      {snapshot.items.length ? (
        <AuditLogsTable data={snapshot.items} />
      ) : (
        <EmptyState
            description="Thử nới bộ lọc hoặc đặt lại truy vấn để xem thêm sự kiện hệ thống."
            title="Không có nhật ký phù hợp"
          />
        )}
    </div>
  );
}
