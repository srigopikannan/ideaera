"use server";

import { discoverPeople } from "@/services/discovery";
import { DiscoveryFilters } from "@/services/discovery";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function searchPeopleAction(filters: DiscoveryFilters) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    const results = await discoverPeople(filters, user.id);
    return { success: true, results };
  } catch (error) {
    console.error("Search people error:", error);
    return { success: false, error: "Failed to search people" };
  }
}

export async function requestConnectionAction(targetUserId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Implementation for connections table would go here
  console.log(`User ${user.id} requested connection to ${targetUserId}`);

  revalidatePath("/people");
  return { success: true };
}
