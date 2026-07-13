"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { extractReceiptData } from "@/lib/ocr";
import type { Category } from "@/lib/types";

export function TransactionForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrNotice, setOcrNotice] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setOcrRunning(true);
    setOcrNotice(null);
    setError(null);

    try {
      const result = await extractReceiptData(file);
      if (result.candidateAmount !== null) {
        setAmount(String(result.candidateAmount));
        setOcrNotice(
          `Read total as ${result.candidateAmount.toFixed(2)} — check it before saving.`,
        );
      } else {
        setOcrNotice("Couldn't read an amount from the photo — enter it manually.");
      }
      if (result.candidateMerchant && !merchant) {
        setMerchant(result.candidateMerchant);
      }
    } catch {
      setOcrNotice("Couldn't read the photo — enter the amount manually.");
    } finally {
      setOcrRunning(false);
    }
  }

  function clearPhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setOcrNotice(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError("Not signed in.");
        return;
      }

      let receiptPath: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        receiptPath = `${userData.user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(receiptPath, photoFile);
        if (uploadError) {
          setError(`Photo upload failed: ${uploadError.message}`);
          return;
        }
      }

      const { error: insertError } = await supabase.from("transactions").insert({
        user_id: userData.user.id,
        amount: parsedAmount,
        category_id: categoryId || null,
        merchant: merchant.trim() || null,
        note: note.trim() || null,
        date,
        receipt_path: receiptPath,
        source: photoFile ? "ocr" : "manual",
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push("/transactions");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-5 text-center">
        {photoPreview ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="Receipt preview"
              className="mx-auto max-h-64 rounded-md object-contain"
            />
            <button
              type="button"
              onClick={clearPhoto}
              className="text-sm text-neutral-500 underline"
            >
              Remove photo
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-2 py-4 text-sm text-neutral-500">
            <span className="font-medium text-neutral-900">
              Add a receipt photo (optional)
            </span>
            <span>We&apos;ll try to read the total automatically.</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="sr-only"
            />
            <span className="mt-2 rounded-md border border-neutral-300 px-3 py-1.5 text-neutral-700">
              Choose photo
            </span>
          </label>
        )}
        {ocrRunning && (
          <p className="mt-2 text-sm text-neutral-500">Reading receipt…</p>
        )}
        {ocrNotice && !ocrRunning && (
          <p className="mt-2 text-sm text-amber-600">{ocrNotice}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-neutral-700">
            Amount
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-neutral-700">
            Category
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-neutral-700">
            Date
          </label>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div>
          <label htmlFor="merchant" className="block text-sm font-medium text-neutral-700">
            Merchant
          </label>
          <input
            id="merchant"
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-neutral-700">
          Note
        </label>
        <input
          id="note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || ocrRunning}
        className="w-full rounded-md bg-neutral-900 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60 sm:w-auto sm:px-6"
      >
        {submitting ? "Saving…" : "Save transaction"}
      </button>
    </form>
  );
}
