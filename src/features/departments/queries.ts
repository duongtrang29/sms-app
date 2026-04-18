import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Department } from "@/types/app";

const listDepartmentsCached = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Department[];
  },
  ["departments:list"],
  {
    revalidate: 60 * 60,
    tags: ["departments"],
  },
);

export async function listDepartments() {
  return listDepartmentsCached();
}

export async function getDepartmentById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Department | null;
}
