const FALLBACK_ERROR_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại";

type ErrorLike = {
  code?: string | null;
  message?: string | null;
};

function toMessage(error: unknown) {
  if (!error) {
    return "";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message ?? "";
  }

  if (typeof error === "object" && "message" in error) {
    const message = (error as ErrorLike).message;
    return typeof message === "string" ? message : "";
  }

  return "";
}

function toCode(error: unknown) {
  if (!error || typeof error === "string" || error instanceof Error) {
    return "";
  }

  if (typeof error === "object" && "code" in error) {
    const code = (error as ErrorLike).code;
    return typeof code === "string" ? code : "";
  }

  return "";
}

function includesAny(source: string, patterns: string[]) {
  return patterns.some((pattern) => source.includes(pattern));
}

function extractDetail(source: string) {
  const separators = [
    "missing prerequisite course:",
    "unsupported grade status transition:",
    "detail:",
    "chi tiet:",
    "chi tiết:",
    ":",
  ];

  for (const separator of separators) {
    const index = source.indexOf(separator);
    if (index < 0) {
      continue;
    }

    const value = source.slice(index + separator.length).trim();
    if (value) {
      return value;
    }
  }

  return "";
}

/**
 * Maps PostgreSQL/Supabase errors to user-facing Vietnamese messages.
 */
export function parseSupabaseError(
  error: unknown,
  fallback = FALLBACK_ERROR_MESSAGE,
) {
  const message = toMessage(error).trim();
  const code = toCode(error);
  const normalized = message.toLowerCase();
  const detail = extractDetail(normalized);

  if (!message && !code) {
    return fallback;
  }

  // register_enrollment() and enrollment related business rules
  if (
    includesAny(normalized, [
      "enrollment_time_closed",
      "registration window is closed",
      "cancellation window is closed",
    ])
  ) {
    return "Ngoài thời gian cho phép thao tác đăng ký học phần.";
  }

  if (
    includesAny(normalized, [
      "offering_not_open",
      "course offering is not open for registration",
      "course offering not found",
    ])
  ) {
    return "Học phần hiện không mở đăng ký.";
  }

  if (
    includesAny(normalized, [
      "already_enrolled",
      "already registered for this course offering",
    ])
  ) {
    return "Bạn đã đăng ký học phần này.";
  }

  if (
    includesAny(normalized, [
      "prerequisite_not_met",
      "missing prerequisite course",
    ])
  ) {
    return detail
      ? `Thiếu môn tiên quyết: ${detail}`
      : "Bạn chưa đạt điều kiện môn tiên quyết.";
  }

  if (
    includesAny(normalized, ["schedule_conflict", "schedule conflict detected"])
  ) {
    return detail ? `Trùng lịch học: ${detail}` : "Lịch học bị trùng với học phần khác.";
  }

  if (
    includesAny(normalized, [
      "credit_limit_exceeded",
      "credit limit exceeded for this semester",
    ])
  ) {
    return "Vượt số tín chỉ tối đa cho phép trong học kỳ.";
  }

  if (
    includesAny(normalized, ["offering_full", "course offering is full"])
  ) {
    return "Học phần đã đủ số lượng sinh viên.";
  }

  // Grade trigger / state machine errors
  if (
    includesAny(normalized, [
      "locked grades can only be changed by admin",
      "only admin can lock grades",
      "only admin can unlock grades",
      "only admin can approve grades",
      "only admin can return submitted grades to draft",
      "only admin can move approved grades to draft",
      "only lecturer or admin can submit grades",
      "unsupported grade status transition",
      "scores can only be edited while grade status is draft",
      "cannot submit grade with incomplete component scores",
    ])
  ) {
    if (normalized.includes("unsupported grade status transition")) {
      const transition = extractDetail(normalized);
      return transition
        ? `Chuyển trạng thái điểm không hợp lệ: ${transition}`
        : "Chuyển trạng thái điểm không hợp lệ.";
    }

    if (normalized.includes("incomplete component scores")) {
      return "Không thể gửi duyệt vì còn thiếu điểm thành phần.";
    }

    if (normalized.includes("scores can only be edited")) {
      return "Chỉ được chỉnh sửa điểm khi bảng điểm ở trạng thái DRAFT.";
    }

    if (
      normalized.includes("only admin can") ||
      normalized.includes("locked grades can only be changed by admin")
    ) {
      return "Bạn không có quyền thực hiện chuyển trạng thái bảng điểm này.";
    }

    return "Không thể chuyển trạng thái bảng điểm.";
  }

  // Generic PostgreSQL error codes
  if (code === "23503" || normalized.includes("foreign key")) {
    return "Không thể xóa/cập nhật vì dữ liệu đang được tham chiếu ở nơi khác.";
  }

  if (code === "23505" || normalized.includes("duplicate key")) {
    return "Dữ liệu đã tồn tại trong hệ thống.";
  }

  if (code === "42501" || includesAny(normalized, ["permission denied", "row-level security"])) {
    return "Bạn không có quyền thực hiện thao tác này.";
  }

  if (includesAny(normalized, ["authentication required", "chưa đăng nhập"])) {
    return "Bạn cần đăng nhập để thực hiện thao tác này.";
  }

  return message || fallback;
}

