"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BudgetFormResult = { error: string } | undefined;

export async function saveMonthlyBudget(
  _prevState: BudgetFormResult,
  formData: FormData,
): Promise<BudgetFormResult> {
  const month = String(formData.get("month") ?? "");
  const incomeAmount = Number(formData.get("income_amount") ?? 0);
  const savingsGoalAmount = Number(formData.get("savings_goal_amount") ?? 0);

  if (!month || Number.isNaN(incomeAmount) || Number.isNaN(savingsGoalAmount)) {
    return { error: "Please fill in valid numbers." };
  }
  if (incomeAmount < 0 || savingsGoalAmount < 0) {
    return { error: "Amounts can't be negative." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: "Not signed in." };
  }

  const { error } = await supabase.from("monthly_budgets").upsert(
    {
      user_id: userData.user.id,
      month,
      income_amount: incomeAmount,
      savings_goal_amount: savingsGoalAmount,
    },
    { onConflict: "user_id,month" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  revalidatePath("/charts");
}
