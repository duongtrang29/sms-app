import Link from "next/link";
import { Suspense } from "react";
import { DoorOpenIcon, PlusIcon } from "lucide-react";

import { RoomsTable } from "@/components/dashboard/rooms-table";
import { FormAlert } from "@/components/forms/form-alert";
import { RoomForm } from "@/components/forms/room-form";
import { FormCardSkeleton } from "@/components/forms/form-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { RoutePanel } from "@/components/shared/route-panel";
import { SectionPanel } from "@/components/shared/section-panel";
import { Button } from "@/components/ui/button";
import { getRoomById, listRooms } from "@/features/rooms/queries";
import {
  buildCreatePath,
  buildReturnPath,
  getSearchParamString,
} from "@/lib/admin-routing";

type RoomsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function RoomEditorCard({
  editId,
  returnTo,
}: {
  editId: string | null;
  returnTo: string;
}) {
  const room = editId ? await getRoomById(editId) : null;

  return (
    <RoomForm key={`room-form-${editId ?? "create"}`} returnTo={returnTo} room={room} />
  );
}

export default async function RoomsPage({ searchParams }: RoomsPageProps) {
  const resolvedSearchParams = await searchParams;
  const editId = getSearchParamString(resolvedSearchParams, "edit") || null;
  const error = getSearchParamString(resolvedSearchParams, "error");
  const queryValue = getSearchParamString(resolvedSearchParams, "q");
  const query = queryValue.toLowerCase();
  const statusFilter = getSearchParamString(resolvedSearchParams, "status");
  const success = getSearchParamString(resolvedSearchParams, "success");
  const mode = getSearchParamString(resolvedSearchParams, "mode");
  const rooms = await listRooms();
  const rows = rooms.filter((room) => {
    if (
      query &&
      ![room.code, room.name, room.building ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }

    if (statusFilter) {
      const statusValue = room.is_active ? "ACTIVE" : "INACTIVE";
      if (statusValue !== statusFilter) {
        return false;
      }
    }

    return true;
  });
  const returnTo = buildReturnPath("/admin/rooms", [
    ["q", queryValue],
    ["status", statusFilter],
  ]);
  const isCreateOpen = mode === "create";
  const isEditorOpen = isCreateOpen || Boolean(editId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Link href={buildCreatePath(returnTo)}>
            <Button type="button">
              <PlusIcon data-icon="inline-start" />
              Thêm mới
            </Button>
          </Link>
        }
        description="Danh mục phòng học."
        icon={<DoorOpenIcon className="size-5" />}
        info="Phòng học được gắn trực tiếp vào lịch học và có kiểm tra trùng phòng ở tầng cơ sở dữ liệu."
        title="Phòng học"
      />
      {error || success ? (
        <FormAlert message={error || success} success={!error} />
      ) : null}
      <SectionPanel>
        <FilterToolbar
          key={`${queryValue}|${statusFilter}`}
          resultCount={rows.length}
          searchPlaceholder="Tìm mã phòng, tên phòng, tòa nhà"
          searchValue={queryValue}
          selects={[
            {
              key: "status",
              label: "Trạng thái",
              options: [
                { label: "Sẵn sàng", value: "ACTIVE" },
                { label: "Ngưng sử dụng", value: "INACTIVE" },
              ],
              placeholder: "Tất cả trạng thái",
            },
          ]}
        />
      </SectionPanel>
      <RoomsTable data={rows} returnTo={returnTo} />
      <RoutePanel
        badge={editId ? "Chỉnh sửa" : "Thêm mới"}
        closeHref={returnTo}
        description="Quản lý mã phòng, tòa nhà, sức chứa và trạng thái sử dụng."
        icon={<DoorOpenIcon className="size-5" />}
        open={isEditorOpen}
        title={editId ? "Cập nhật phòng học" : "Thêm phòng học"}
        variant="dialog"
      >
        <Suspense
          fallback={<FormCardSkeleton sections={2} title="Đang tải biểu mẫu phòng học" />}
          key={editId ?? "create"}
        >
          <RoomEditorCard editId={editId} returnTo={returnTo} />
        </Suspense>
      </RoutePanel>
    </div>
  );
}
