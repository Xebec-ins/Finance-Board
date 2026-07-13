export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_default: boolean;
  created_at: string;
};

export type MonthlyBudget = {
  id: string;
  user_id: string;
  month: string; // ISO date, always the 1st of the month
  income_amount: number;
  savings_goal_amount: number;
  created_at: string;
};

export type TransactionSource = "manual" | "ocr";

export type Transaction = {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  merchant: string | null;
  note: string | null;
  date: string; // ISO date
  receipt_path: string | null;
  source: TransactionSource;
  created_at: string;
};

export type TransactionWithCategory = Transaction & {
  category: Category | null;
};
