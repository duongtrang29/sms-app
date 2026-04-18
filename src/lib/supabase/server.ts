import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { publicEnv, serverEnv } from "@/lib/env";
import { supabaseResilientFetch } from "@/lib/network/resilient-fetch";
import type { Database } from "@/types/database";

/**
 * For Server Actions/Route Handlers with authenticated user context.
 * Uses anon key + cookie session and obeys RLS.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return _createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, options, value }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookie mutation can fail in some server component boundaries.
          }
        },
      },
      global: {
        fetch: supabaseResilientFetch,
      },
    },
  );
}

/**
 * For admin-only operations in server actions.
 * Uses service role key and intentionally ignores user cookies.
 */
export function createAdminClient() {
  return _createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op: admin client does not persist auth cookies.
        },
      },
      global: {
        fetch: supabaseResilientFetch,
      },
    },
  );
}

/**
 * Backward-compatible alias for existing code paths.
 */
export async function createClient() {
  return createServerClient();
}

