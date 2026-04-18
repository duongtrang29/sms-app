"use client";

import { PageErrorState } from "@/components/shared/page-error-state";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <PageErrorState
      description="Hệ thống đang gặp sự cố ngoài dự kiến. Hãy thử tải lại trang hoặc quay lại sau ít phút."
      reset={reset}
      title="Đã xảy ra lỗi hệ thống"
    />
  );
}
