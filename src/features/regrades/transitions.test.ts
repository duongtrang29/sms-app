import { describe, expect, it } from "vitest";

import {
  getAllowedNextRegradeStatuses,
  isTerminalRegradeStatus,
  isValidRegradeTransition,
} from "@/features/regrades/transitions";

describe("regrade transition guards", () => {
  it("allows the configured PENDING transitions", () => {
    expect(getAllowedNextRegradeStatuses("PENDING")).toEqual([
      "UNDER_REVIEW",
      "RESOLVED",
      "REJECTED",
      "CANCELLED",
    ]);
  });

  it("rejects invalid lifecycle jumps", () => {
    expect(isValidRegradeTransition("PENDING", "PENDING")).toBe(false);
    expect(isValidRegradeTransition("RESOLVED", "UNDER_REVIEW")).toBe(false);
    expect(isValidRegradeTransition("REJECTED", "RESOLVED")).toBe(false);
  });

  it("marks terminal statuses correctly", () => {
    expect(isTerminalRegradeStatus("RESOLVED")).toBe(true);
    expect(isTerminalRegradeStatus("REJECTED")).toBe(true);
    expect(isTerminalRegradeStatus("CANCELLED")).toBe(true);
    expect(isTerminalRegradeStatus("UNDER_REVIEW")).toBe(false);
  });
});
