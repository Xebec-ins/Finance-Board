import { recognize } from "tesseract.js";

export type OcrResult = {
  text: string;
  candidateAmount: number | null;
  candidateMerchant: string | null;
};

const TOTAL_KEYWORDS = /\b(grand\s*total|total\s*due|amount\s*due|balance\s*due|total)\b/i;
const CURRENCY_NUMBER = /(?:[$€£₹]|USD|EUR|GBP|INR)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?)/g;

function parseAmount(raw: string): number | null {
  const normalized = raw.replace(/,(?=\d{3}\b)/g, "").replace(",", ".");
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function findAmountsInText(text: string): number[] {
  const amounts: number[] = [];
  for (const match of text.matchAll(CURRENCY_NUMBER)) {
    const amount = parseAmount(match[1]);
    if (amount !== null && amount > 0 && amount < 1_000_000) {
      amounts.push(amount);
    }
  }
  return amounts;
}

/** Runs OCR on a receipt photo and guesses the total amount and merchant name. */
export async function extractReceiptData(file: File): Promise<OcrResult> {
  const { data } = await recognize(file, "eng");
  const text = data.text;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let candidateAmount: number | null = null;

  const totalLine = lines.find((line) => TOTAL_KEYWORDS.test(line));
  if (totalLine) {
    const amounts = findAmountsInText(totalLine);
    if (amounts.length > 0) {
      candidateAmount = amounts[amounts.length - 1];
    }
  }

  if (candidateAmount === null) {
    const allAmounts = findAmountsInText(text);
    if (allAmounts.length > 0) {
      candidateAmount = Math.max(...allAmounts);
    }
  }

  const candidateMerchant = lines.length > 0 ? lines[0].slice(0, 60) : null;

  return { text, candidateAmount, candidateMerchant };
}
