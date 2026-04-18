import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="w-full max-w-2xl">
        <EmptyState
          action={
            <Link href="/admin">
              <Button type="button" variant="outline">
                Về trang quản trị
              </Button>
            </Link>
          }
          description="Không tìm thấy tài nguyên quản trị mà bạn đang truy cập."
          title="Trang quản trị không tồn tại"
        />
      </div>
    </div>
  );
}
