"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { nextCategoryColor } from "@/lib/palette";

export type CategoryFormResult = { error: string } | undefined;

export async function createCategory(
  _prevState: CategoryFormResult,
  formData: FormData,
): Promise<CategoryFormResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Category name is required." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: "Not signed in." };
  }

  const { count } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userData.user.id);

  const color = nextCategoryColor(count ?? 0);

  const { error } = await supabase.from("categories").insert({
    user_id: userData.user.id,
    name,
    color,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/transactions");
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", categoryId);
  revalidatePath("/settings");
  revalidatePath("/transactions");
}
