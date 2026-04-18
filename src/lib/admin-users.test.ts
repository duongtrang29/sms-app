import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  tryCreateAuditLog: vi.fn(),
  profileUpdateEq: vi.fn(),
  updateUserById: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  tryCreateAuditLog: mocks.tryCreateAuditLog,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        updateUserById: mocks.updateUserById,
      },
    },
    from: () => ({
      update: () => ({
        eq: mocks.profileUpdateEq,
      }),
    }),
  }),
}));

import { updateManagedUser } from "@/lib/admin-users";

describe("updateManagedUser", () => {
  beforeEach(() => {
    mocks.updateUserById.mockReset();
    mocks.profileUpdateEq.mockReset();
    mocks.tryCreateAuditLog.mockReset();

    mocks.updateUserById.mockResolvedValue({ error: null });
    mocks.profileUpdateEq.mockResolvedValue({ error: null });
    mocks.tryCreateAuditLog.mockResolvedValue({ status: "success" });
  });

  it("returns failed when auth step fails before profile update", async () => {
    mocks.updateUserById.mockResolvedValue({
      error: { message: "auth service unavailable" },
    });

    const result = await updateManagedUser({
      fullName: "Nguyen Van A",
      password: "NewPassword#123",
      phone: "0900000000",
      status: "ACTIVE",
      userId: "11111111-1111-1111-1111-111111111111",
    });

    expect(result.status).toBe("failed");
    expect(result.authStep).toBe("failed");
    expect(result.profileStep).toBe("skipped");
    expect(result.auditStep).toBe("skipped");
    expect(result.message).toContain("Không thể cập nhật mật khẩu");
  });

  it("returns partial when auth succeeds but profile update fails", async () => {
    mocks.profileUpdateEq.mockResolvedValue({
      error: { message: "duplicate key value violates unique constraint" },
    });

    const result = await updateManagedUser({
      fullName: "Nguyen Van B",
      password: "NewPassword#123",
      phone: "0900000001",
      status: "ACTIVE",
      userId: "22222222-2222-2222-2222-222222222222",
    });

    expect(result.status).toBe("partial");
    expect(result.authStep).toBe("success");
    expect(result.profileStep).toBe("failed");
    expect(result.auditStep).toBe("skipped");
    expect(result.message).toContain("Đã cập nhật mật khẩu");
  });

  it("returns partial when audit logging fails after successful updates", async () => {
    mocks.tryCreateAuditLog.mockResolvedValue({
      message: "rpc failed",
      reason: "AUDIT_RPC_FAILED",
      status: "failed",
    });

    const result = await updateManagedUser({
      fullName: "Nguyen Van C",
      phone: "0900000002",
      status: "ACTIVE",
      userId: "33333333-3333-3333-3333-333333333333",
    });

    expect(result.status).toBe("partial");
    expect(result.profileStep).toBe("success");
    expect(result.auditStep).toBe("failed");
    expect(result.message).toContain("không ghi được audit log");
  });

  it("returns success when all steps complete", async () => {
    const result = await updateManagedUser({
      fullName: "Nguyen Van D",
      phone: "0900000003",
      status: "ACTIVE",
      userId: "44444444-4444-4444-4444-444444444444",
    });

    expect(result.status).toBe("success");
    expect(result.profileStep).toBe("success");
    expect(result.auditStep).toBe("success");
  });
});
