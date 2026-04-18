import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function StudentNotFound() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="w-full max-w-2xl">
        <EmptyState
          action={
            <Link href="/student">
              <Button type="button" variant="outline">
                Về trang sinh viên
              </Button>
            </Link>
          }
          description="Không tìm thấy trang sinh viên bạn đang truy cập."
          title="Trang sinh viên không tồn tại"
        />
      </div>
    </div>
  );
}
