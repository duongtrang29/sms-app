import {
  Clock3Icon,
  DatabaseIcon,
  SearchCheckIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { AuditLogsTable } from "@/components/dashboard/audit-logs-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { StatCard } from "@/components/shared/stat-card";
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
        description="Theo dõi thao tác nhạy cảm & đối soát dữ liệu."
        icon={<ShieldCheckIcon className="size-5" />}
        info="Theo dõi các thao tác nhạy cảm trên hệ thống để kiểm tra phân quyền, truy vết thay đổi và đối chiếu dữ liệu minh họa với dữ liệu thật."
        title="Audit log"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          description="Tổng số sự kiện đã ghi nhận"
          icon={<ShieldCheckIcon className="size-4" />}
          label="Tổng sự kiện"
          value={snapshot.summary.totalEvents}
        />
        <StatCard
          description="Sự kiện phát sinh trong hôm nay theo múi giờ máy chủ"
          icon={<Clock3Icon className="size-4" />}
          label="Hôm nay"
          value={snapshot.summary.todayEvents}
        />
        <StatCard
          description="Các sự kiện liên quan xác thực"
          icon={<SearchCheckIcon className="size-4" />}
          label="Sự kiện xác thực"
          value={snapshot.summary.authEvents}
        />
        <StatCard
          description="Sự kiện thuộc nhóm dữ liệu minh họa"
          icon={<DatabaseIcon className="size-4" />}
          label="Sự kiện minh họa"
          value={snapshot.summary.demoEvents}
        />
        <StatCard
          description="Sự kiện thuộc dữ liệu thật"
          icon={<DatabaseIcon className="size-4" />}
          label="Sự kiện dữ liệu thật"
          value={snapshot.summary.liveEvents}
        />
      </div>
      <SectionPanel>
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
      </SectionPanel>
      {snapshot.items.length ? (
        <AuditLogsTable data={snapshot.items} />
      ) : (
        <EmptyState
            description="Thử nới bộ lọc hoặc đặt lại truy vấn để xem thêm sự kiện hệ thống."
            icon={<SearchCheckIcon className="size-5" />}
            title="Không có nhật ký phù hợp"
          />
        )}
    </div>
  );
}
