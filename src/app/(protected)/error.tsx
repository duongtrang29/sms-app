"use client";

import { PageErrorState } from "@/components/shared/page-error-state";

type ProtectedErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProtectedError({ reset }: ProtectedErrorProps) {
  return (
    <PageErrorState
      description="Không thể tải không gian làm việc vào lúc này. Hãy thử tải lại trang hoặc thực hiện lại thao tác."
      reset={reset}
      title="Đã xảy ra lỗi khi tải dữ liệu"
    />
  );
}
