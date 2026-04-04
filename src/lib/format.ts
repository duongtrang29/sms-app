import { format } from "date-fns";

export function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return "Chưa có";
  }

  return format(new Date(value), "dd/MM/yyyy");
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) {
    return "Chưa có";
  }

  return format(new Date(value), "dd/MM/yyyy HH:mm");
}

export function formatScore(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return "Chưa có";
  }

  return Number(value).toFixed(2);
}

export function weekdayLabel(day: number) {
  const labels = [
    "",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
    "Chủ nhật",
  ];

  return labels[day] ?? "Chưa có";
}

export function weekPatternLabel(value: string | null | undefined) {
  if (!value) {
    return "Chưa có";
  }

  const labelMap: Record<string, string> = {
    ALL: "Mọi tuần",
    EVEN: "Tuần chẵn",
    ODD: "Tuần lẻ",
  };

  return labelMap[value] ?? value;
}
