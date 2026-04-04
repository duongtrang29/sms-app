"use client";

import { PageErrorState } from "@/components/shared/page-error-state";

type AuthErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AuthError({ reset }: AuthErrorProps) {
  return (
    <PageErrorState
      description="Không thể tải màn hình xác thực vào lúc này. Hãy thử lại sau ít phút."
      reset={reset}
      title="Lỗi tải trang xác thực"
    />
  );
}
