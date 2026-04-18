"use client";

import { createClient as createBrowserClient } from "@/lib/supabase/browser";

export function createClient() {
  return createBrowserClient();
}
