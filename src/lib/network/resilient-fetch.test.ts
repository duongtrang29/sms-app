import { describe, expect, it, vi } from "vitest";

import { createResilientFetch, FetchTimeoutError } from "@/lib/network/resilient-fetch";

function asFetch(mock: ReturnType<typeof vi.fn>) {
  return mock as unknown as typeof fetch;
}

describe("createResilientFetch", () => {
  it("retries transient GET responses with backoff", async () => {
    const sleep = vi.fn(async () => undefined);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("temporary failure", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const resilientFetch = createResilientFetch({
      backoffMs: 1,
      baseFetch: asFetch(fetchMock),
      maxRetries: 2,
      random: () => 0,
      sleep,
      timeoutMs: 100,
    });

    const response = await resilientFetch("https://example.com/data", {
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("does not retry POST responses to avoid duplicate writes", async () => {
    const sleep = vi.fn(async () => undefined);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("temporary failure", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const resilientFetch = createResilientFetch({
      backoffMs: 1,
      baseFetch: asFetch(fetchMock),
      maxRetries: 2,
      random: () => 0,
      sleep,
      timeoutMs: 100,
    });

    const response = await resilientFetch("https://example.com/data", {
      method: "POST",
    });

    expect(response.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("retries transient network errors on GET", async () => {
    const sleep = vi.fn(async () => undefined);
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const resilientFetch = createResilientFetch({
      backoffMs: 1,
      baseFetch: asFetch(fetchMock),
      maxRetries: 2,
      random: () => 0,
      sleep,
      timeoutMs: 100,
    });

    const response = await resilientFetch("https://example.com/data");

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("throws FetchTimeoutError when request exceeds timeout budget", async () => {
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>(() => {
          // Keep pending to simulate upstream hang.
        }),
    );

    const resilientFetch = createResilientFetch({
      backoffMs: 1,
      baseFetch: asFetch(fetchMock),
      maxRetries: 0,
      random: () => 0,
      sleep: async () => undefined,
      timeoutMs: 5,
    });

    await expect(
      resilientFetch("https://example.com/data", { method: "GET" }),
    ).rejects.toBeInstanceOf(FetchTimeoutError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
