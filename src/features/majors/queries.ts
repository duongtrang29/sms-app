import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Major } from "@/types/app";

const listMajorsCached = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("majors")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Major[];
  },
  ["majors:list"],
  {
    revalidate: 60 * 60,
    tags: ["majors"],
  },
);

export async function listMajors() {
  return listMajorsCached();
}

export async function getMajorById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("majors")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Major | null;
}
