import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="w-full max-w-2xl">
        <EmptyState
          action={
            <Link href="/">
              <Button type="button" variant="outline">
                Quay về trang chủ
              </Button>
            </Link>
          }
          description="Đường dẫn bạn truy cập không tồn tại hoặc đã được thay đổi."
          title="Không tìm thấy trang"
        />
      </div>
    </div>
  );
}
