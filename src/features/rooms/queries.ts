import { createClient } from "@/lib/supabase/server";
import type { Room } from "@/types/app";

export async function listRooms() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .order("code", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as Room[];
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
