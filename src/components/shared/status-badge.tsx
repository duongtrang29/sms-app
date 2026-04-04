import type { ComponentProps } from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  Clock3Icon,
  InfoIcon,
  SlashIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
  value: string | null | undefined;
};

type BadgeTone = Extract<
  NonNullable<ComponentProps<typeof Badge>["variant"]>,
  "destructive" | "info" | "neutral" | "outline" | "success" | "warning"
>;

const statusMetaMap: Record<
  string,
  {
    icon: React.ReactNode;
    label: string;
    tone: BadgeTone;
  }
> = {
  ACTIVE: {
    icon: <CheckCircle2Icon aria-hidden="true" className="size-3.5" />,
    label: "Hoạt động",
    tone: "success",
  },
  APPROVED: {
    icon: <CheckCircle2Icon aria-hidden="true" className="size-3.5" />,
    label: "Đã duyệt",
    tone: "success",
  },
  CANCELLED: {
    icon: <AlertTriangleIcon aria-hidden="true" className="size-3.5" />,
    label: "Đã hủy",
    tone: "destructive",
  },
  CLOSED: {
    icon: <SlashIcon aria-hidden="true" className="size-3.5" />,
    label: "Đã đóng",
    tone: "neutral",
  },
  COMPLETED: {
    icon: <CheckCircle2Icon aria-hidden="true" className="size-3.5" />,
    label: "Hoàn tất",
    tone: "success",
  },
  DRAFT: {
    icon: <Clock3Icon aria-hidden="true" className="size-3.5" />,
    label: "Nháp",
    tone: "warning",
  },
  DROPPED: {
    icon: <AlertTriangleIcon aria-hidden="true" className="size-3.5" />,
    label: "Đã thôi học",
    tone: "destructive",
  },
  ENROLLED: {
    icon: <InfoIcon aria-hidden="true" className="size-3.5" />,
    label: "Đã đăng ký",
    tone: "info",
  },
  FINISHED: {
    icon: <SlashIcon aria-hidden="true" className="size-3.5" />,
    label: "Kết thúc",
    tone: "neutral",
  },
  GRADUATED: {
    icon: <CheckCircle2Icon aria-hidden="true" className="size-3.5" />,
    label: "Tốt nghiệp",
    tone: "success",
  },
  INACTIVE: {
    icon: <SlashIcon aria-hidden="true" className="size-3.5" />,
    label: "Tạm ngưng",
    tone: "neutral",
  },
  LOCKED: {
    icon: <SlashIcon aria-hidden="true" className="size-3.5" />,
    label: "Đã khóa",
    tone: "neutral",
  },
  OPEN: {
    icon: <InfoIcon aria-hidden="true" className="size-3.5" />,
    label: "Đang mở",
    tone: "info",
  },
  PENDING: {
    icon: <Clock3Icon aria-hidden="true" className="size-3.5" />,
    label: "Chờ xử lý",
    tone: "warning",
  },
  REJECTED: {
    icon: <AlertTriangleIcon aria-hidden="true" className="size-3.5" />,
    label: "Từ chối",
    tone: "destructive",
  },
  RESOLVED: {
    icon: <CheckCircle2Icon aria-hidden="true" className="size-3.5" />,
    label: "Đã xử lý",
    tone: "success",
  },
  SUBMITTED: {
    icon: <Clock3Icon aria-hidden="true" className="size-3.5" />,
    label: "Chờ duyệt",
    tone: "warning",
  },
  SUSPENDED: {
    icon: <Clock3Icon aria-hidden="true" className="size-3.5" />,
    label: "Tạm dừng",
    tone: "warning",
  },
  UNDER_REVIEW: {
    icon: <InfoIcon aria-hidden="true" className="size-3.5" />,
    label: "Đang xem xét",
    tone: "info",
  },
};

const dotClassNameMap: Partial<Record<BadgeTone, string>> = {
  destructive: "bg-[color:var(--color-danger)]",
  info: "bg-[color:var(--color-info)]",
  neutral: "bg-[color:var(--color-neutral)]",
  success: "bg-[color:var(--color-success)]",
  warning: "bg-[color:var(--color-warning)]",
};

export function StatusBadge({ value }: StatusBadgeProps) {
  if (!value) {
    return <Badge variant="outline">Chưa có</Badge>;
  }

  const meta = statusMetaMap[value] ?? {
    icon: <InfoIcon aria-hidden="true" className="size-3.5" />,
    label: value,
    tone: "outline" as const,
  };

  return (
    <Badge variant={meta.tone}>
      {meta.tone !== "outline" ? (
        <span
          className={`app-status-dot ${dotClassNameMap[meta.tone] ?? "bg-current/70"}`}
        />
      ) : null}
      {meta.icon}
      {meta.label}
    </Badge>
  );
}
