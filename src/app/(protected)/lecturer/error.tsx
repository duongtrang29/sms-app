"use client";

import { PageErrorState } from "@/components/shared/page-error-state";

type LecturerErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LecturerError({ reset }: LecturerErrorProps) {
  return (
    <PageErrorState
      description="Không thể tải khu vực giảng viên vào lúc này. Hãy thử tải lại trang."
      reset={reset}
      title="Lỗi tải trang giảng viên"
    />
  );
}
