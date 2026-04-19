import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
  value: string | null | undefined;
};

type BadgeTone = Extract<
  NonNullable<ComponentProps<typeof Badge>["variant"]>,
  | "destructive"
  | "info"
  | "neutral"
  | "outline"
  | "success"
  | "violet"
  | "warning"
>;

const statusMetaMap: Record<
  string,
  {
    label: string;
    tone: BadgeTone;
  }
> = {
  ACTIVE: { label: "Hoạt động", tone: "success" },
  APPROVED: { label: "Đã duyệt", tone: "success" },
  CANCELLED: { label: "Đã hủy", tone: "destructive" },
  CLOSED: { label: "Đã đóng", tone: "neutral" },
  COMPLETED: { label: "Hoàn tất", tone: "success" },
  DRAFT: { label: "Nháp", tone: "neutral" },
  DROPPED: { label: "Đã thôi học", tone: "destructive" },
  ENROLLED: { label: "Đã đăng ký", tone: "info" },
  FINISHED: { label: "Kết thúc", tone: "neutral" },
  GRADUATED: { label: "Tốt nghiệp", tone: "success" },
  INACTIVE: { label: "Tạm ngưng", tone: "neutral" },
  LOCKED: { label: "Đã khóa", tone: "violet" },
  OPEN: { label: "Đang mở", tone: "info" },
  PENDING: { label: "Chờ xử lý", tone: "warning" },
  REJECTED: { label: "Từ chối", tone: "destructive" },
  RESOLVED: { label: "Đã xử lý", tone: "success" },
  SUBMITTED: { label: "Chờ duyệt", tone: "warning" },
  SUSPENDED: { label: "Tạm dừng", tone: "warning" },
  UNDER_REVIEW: { label: "Đang xem xét", tone: "info" },
};

export function StatusBadge({ value }: StatusBadgeProps) {
  if (!value) {
    return <Badge variant="outline">Chưa có</Badge>;
  }

  const meta = statusMetaMap[value] ?? {
    label: value,
    tone: "outline" as const,
  };

  return <Badge variant={meta.tone}>{meta.label}</Badge>;
}
