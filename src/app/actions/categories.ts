"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
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

  const user = await getUser();
  if (!user) return { error: "Not signed in." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const color = nextCategoryColor(count ?? 0);

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
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
