import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Room } from "@/types/app";

const listRoomsCached = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("code", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Room[];
  },
  ["rooms:list"],
  {
    revalidate: 60 * 60,
    tags: ["rooms"],
  },
);

export async function listRooms() {
  return listRoomsCached();
}

export async function getRoomById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Room | null;
}
