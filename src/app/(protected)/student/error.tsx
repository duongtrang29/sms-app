"use client";

import { PageErrorState } from "@/components/shared/page-error-state";

type StudentErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function StudentError({ reset }: StudentErrorProps) {
  return (
    <PageErrorState
      description="Không thể tải khu vực sinh viên vào lúc này. Hãy thử lại sau vài giây."
      reset={reset}
      title="Lỗi tải trang sinh viên"
    />
  );
}
