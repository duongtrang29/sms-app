import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function LecturerNotFound() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="w-full max-w-2xl">
        <EmptyState
          action={
            <Link href="/lecturer">
              <Button type="button" variant="outline">
                Về trang giảng viên
              </Button>
            </Link>
          }
          description="Không tìm thấy trang hoặc tài nguyên giảng viên yêu cầu."
          title="Trang giảng viên không tồn tại"
        />
      </div>
    </div>
  );
}
