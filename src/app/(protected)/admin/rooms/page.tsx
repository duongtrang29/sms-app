import Link from "next/link";
import { Suspense } from "react";

import { RoomsTable } from "@/components/dashboard/rooms-table";
import { FormAlert } from "@/components/forms/form-alert";
import { RoomForm } from "@/components/forms/room-form";
import {
  FormCardSkeleton,
  FormPanelCard,
} from "@/components/forms/form-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getRoomById, listRooms } from "@/features/rooms/queries";
import { buildReturnPath, getSearchParamString } from "@/lib/admin-routing";

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
    <FormPanelCard
      description="Chuẩn hóa phòng học giúp gán lịch và kiểm tra trùng phòng chính xác."
      title={room ? "Cập nhật phòng học" : "Tạo phòng học mới"}
    >
      <RoomForm key={`room-form-${editId ?? "create"}`} returnTo={returnTo} room={room} />
    </FormPanelCard>
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          editId ? (
            <Link href={returnTo}>
              <Button type="button" variant="outline">
                Tạo mới
              </Button>
            </Link>
          ) : null
        }
        description="Phòng học được gắn trực tiếp vào lịch học và có kiểm tra trùng phòng ở tầng cơ sở dữ liệu."
        title="Quản lý phòng học"
      />
      {error || success ? (
        <FormAlert message={error || success} success={!error} />
      ) : null}
      <FormPanelCard
        description="Tìm nhanh theo mã phòng, tên phòng, tòa nhà và trạng thái sử dụng."
        title="Bộ lọc phòng học"
      >
        <FilterToolbar
          key={`${queryValue}|${statusFilter}`}
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
      </FormPanelCard>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.9fr)]">
        <RoomsTable data={rows} returnTo={returnTo} />
        <Suspense
          fallback={<FormCardSkeleton sections={2} title="Đang tải biểu mẫu phòng học" />}
          key={editId ?? "create"}
        >
          <RoomEditorCard editId={editId} returnTo={returnTo} />
        </Suspense>
      </div>
    </div>
  );
}
