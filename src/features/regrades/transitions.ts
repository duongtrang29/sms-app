import type { RegradeStatus } from "@/types/app";

const REGRADE_TRANSITIONS: Record<RegradeStatus, RegradeStatus[]> = {
  CANCELLED: [],
  PENDING: ["UNDER_REVIEW", "RESOLVED", "REJECTED", "CANCELLED"],
  REJECTED: [],
  RESOLVED: [],
  UNDER_REVIEW: ["RESOLVED", "REJECTED", "CANCELLED"],
};

export function getAllowedNextRegradeStatuses(
  currentStatus: RegradeStatus,
): RegradeStatus[] {
  return REGRADE_TRANSITIONS[currentStatus] ?? [];
}

export function isValidRegradeTransition(
  currentStatus: RegradeStatus,
  nextStatus: RegradeStatus,
) {
  return getAllowedNextRegradeStatuses(currentStatus).includes(nextStatus);
}

export function isTerminalRegradeStatus(status: RegradeStatus) {
  return getAllowedNextRegradeStatuses(status).length === 0;
}
