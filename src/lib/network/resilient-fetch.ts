type RetryableMethod = "GET" | "HEAD" | "OPTIONS";

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BACKOFF_MS = 250;
const DEFAULT_JITTER_RATIO = 0.25;
const RETRYABLE_METHODS: ReadonlySet<RetryableMethod> = new Set([
  "GET",
  "HEAD",
  "OPTIONS",
]);
const RETRYABLE_STATUS_CODES: ReadonlySet<number> = new Set([
  408,
  425,
  429,
  500,
  502,
  503,
  504,
]);

export class FetchTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "FetchTimeoutError";
  }
}

type SleepFn = (durationMs: number) => Promise<void>;

type ResilientFetchConfig = {
  backoffMs: number;
  baseFetch: typeof fetch;
  jitterRatio: number;
  maxRetries: number;
  random: () => number;
  sleep: SleepFn;
  timeoutMs: number;
};

type ResolvedConfig = ResilientFetchConfig;

type AbortLink = {
  cleanup: () => void;
  signal: AbortSignal | undefined;
};

function defaultSleep(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

function normalizeMethod(method: string | undefined) {
  return (method ?? "GET").toUpperCase();
}

function isRetryableMethod(method: string) {
  return RETRYABLE_METHODS.has(method as RetryableMethod);
}

function isAbortLikeError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.name === "AbortError") {
    return true;
  }

  return false;
}

function isRetryableNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error instanceof FetchTimeoutError) {
    return true;
  }

  if (isAbortLikeError(error)) {
    return true;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("network") ||
    message.includes("fetch failed") ||
    message.includes("socket") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("timeout")
  );
}

function shouldRetryResponse(response: Response, method: string) {
  if (!isRetryableMethod(method)) {
    return false;
  }

  return RETRYABLE_STATUS_CODES.has(response.status);
}

function shouldRetryError(error: unknown, method: string) {
  if (!isRetryableMethod(method)) {
    return false;
  }

  return isRetryableNetworkError(error);
}

function calculateBackoffDelay(
  baseBackoffMs: number,
  attemptNumber: number,
  jitterRatio: number,
  random: () => number,
) {
  const exponentialDelay = baseBackoffMs * 2 ** Math.max(0, attemptNumber - 1);
  const jitterWindow = exponentialDelay * jitterRatio;
  const jitterOffset = (random() * 2 - 1) * jitterWindow;
  return Math.max(0, Math.round(exponentialDelay + jitterOffset));
}

function mergeAbortSignals(
  signals: Array<AbortSignal | null | undefined>,
): AbortLink {
  const validSignals = signals.filter(
    (signal): signal is AbortSignal => signal !== undefined && signal !== null,
  );

  if (!validSignals.length) {
    return {
      cleanup: () => {},
      signal: undefined,
    };
  }

  const controller = new AbortController();
  const listeners = new Map<AbortSignal, () => void>();

  const cleanup = () => {
    listeners.forEach((listener, signal) => {
      signal.removeEventListener("abort", listener);
    });
    listeners.clear();
  };

  for (const signal of validSignals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      cleanup();
      return { cleanup, signal: controller.signal };
    }

    const listener = () => {
      controller.abort(signal.reason);
      cleanup();
    };

    listeners.set(signal, listener);
    signal.addEventListener("abort", listener, { once: true });
  }

  return {
    cleanup,
    signal: controller.signal,
  };
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number,
) {
  const timeoutController = new AbortController();
  const { cleanup, signal } = mergeAbortSignals([
    init?.signal,
    timeoutController.signal,
  ]);

  const requestInit: RequestInit = {
    ...init,
  };

  if (signal !== undefined) {
    requestInit.signal = signal;
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        timeoutController.abort();
        reject(new FetchTimeoutError(timeoutMs));
      }, timeoutMs);
    });

    const fetchPromise = fetchImpl(input, requestInit);
    return await Promise.race([fetchPromise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    cleanup();
  }
}

function resolveConfig(config: Partial<ResilientFetchConfig> | undefined): ResolvedConfig {
  return {
    backoffMs: config?.backoffMs ?? DEFAULT_BACKOFF_MS,
    baseFetch: config?.baseFetch ?? fetch,
    jitterRatio: config?.jitterRatio ?? DEFAULT_JITTER_RATIO,
    maxRetries: config?.maxRetries ?? DEFAULT_MAX_RETRIES,
    random: config?.random ?? Math.random,
    sleep: config?.sleep ?? defaultSleep,
    timeoutMs: config?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  };
}

export function createResilientFetch(config?: Partial<ResilientFetchConfig>): typeof fetch {
  const resolvedConfig = resolveConfig(config);

  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = normalizeMethod(init?.method);
    const maxAttempts = resolvedConfig.maxRetries + 1;
    let attempt = 1;

    while (attempt <= maxAttempts) {
      try {
        const response = await fetchWithTimeout(
          resolvedConfig.baseFetch,
          input,
          init,
          resolvedConfig.timeoutMs,
        );

        if (attempt < maxAttempts && shouldRetryResponse(response, method)) {
          const delayMs = calculateBackoffDelay(
            resolvedConfig.backoffMs,
            attempt,
            resolvedConfig.jitterRatio,
            resolvedConfig.random,
          );
          await resolvedConfig.sleep(delayMs);
          attempt += 1;
          continue;
        }

        return response;
      } catch (error) {
        if (attempt < maxAttempts && shouldRetryError(error, method)) {
          const delayMs = calculateBackoffDelay(
            resolvedConfig.backoffMs,
            attempt,
            resolvedConfig.jitterRatio,
            resolvedConfig.random,
          );
          await resolvedConfig.sleep(delayMs);
          attempt += 1;
          continue;
        }

        throw error;
      }
    }

    throw new Error("Resilient fetch exhausted all attempts.");
  };
}

export const supabaseResilientFetch = createResilientFetch();
