import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  tryCreateAuditLog: vi.fn(),
  createClient: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/audit", () => ({
  tryCreateAuditLog: mocks.tryCreateAuditLog,
}));

vi.mock("@/lib/env", () => ({
  publicEnv: {
    NEXT_PUBLIC_APP_URL: "https://sms.test.local",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    NEXT_PUBLIC_SUPABASE_URL: "https://supabase.test.local",
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { loginAction, resetPasswordAction } from "@/features/auth/actions";

function buildLoginFormData() {
  const formData = new FormData();
  formData.set("email", "student@school.edu.vn");
  formData.set("password", "Password#123");
  return formData;
}

describe("auth actions", () => {
  const signInWithPassword = vi.fn();
  const signOut = vi.fn();
  const updateUser = vi.fn();
  const maybeSingle = vi.fn();
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    signInWithPassword.mockReset();
    signOut.mockReset();
    updateUser.mockReset();
    maybeSingle.mockReset();
    mocks.tryCreateAuditLog.mockReset();
    mocks.createClient.mockReset();
    mocks.redirect.mockReset();

    signInWithPassword.mockResolvedValue({
      data: { user: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" } },
      error: null,
    });
    signOut.mockResolvedValue(undefined);
    updateUser.mockResolvedValue({ error: null });
    maybeSingle.mockResolvedValue({
      data: { role_code: "STUDENT", status: "ACTIVE" },
      error: null,
    });
    mocks.tryCreateAuditLog.mockResolvedValue({
      message: "audit failed",
      reason: "AUDIT_RPC_FAILED",
      status: "failed",
    });

    mocks.createClient.mockResolvedValue({
      auth: {
        signInWithPassword,
        signOut,
        updateUser,
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle,
          }),
        }),
      }),
    });
  });

  afterAll(() => {
    consoleError.mockRestore();
  });

  it("keeps login success path even when security audit cannot be written", async () => {
    await loginAction(
      { status: "failed", success: false },
      buildLoginFormData(),
    );

    expect(signOut).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("returns partial status when password is updated but audit logging fails", async () => {
    const formData = new FormData();
    formData.set("password", "Password#456");
    formData.set("confirmPassword", "Password#456");

    const result = await resetPasswordAction(
      { status: "failed", success: false },
      formData,
    );

    expect(updateUser).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.status).toBe("partial");
    expect(result.message).toContain("đã cập nhật nhưng");
  });
});
