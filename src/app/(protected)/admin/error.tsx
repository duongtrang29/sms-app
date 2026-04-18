"use client";

import { PageErrorState } from "@/components/shared/page-error-state";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ reset }: AdminErrorProps) {
  return (
    <PageErrorState
      description="Không thể tải khu vực quản trị vào lúc này. Hãy thử lại để tiếp tục thao tác."
      reset={reset}
      title="Lỗi tải trang quản trị"
    />
  );
}
