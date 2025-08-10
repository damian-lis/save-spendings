"use client";

import { useState } from "react";

export default function Home() {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const isValid = (() => {
    if (!amount) return false;
    const n = Number(amount);
    return Number.isFinite(n) && n > 0;
  })();

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <form
        onSubmit={async (e) => {
          e?.preventDefault();
          if (!isValid || status === "loading") return;
          try {
            setStatus("loading");
            setMessage("");
            const res = await fetch("/api/send-to-sheet", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ value: Number(amount), note: note?.trim() || undefined }),
            });
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            setStatus("success");
            setMessage("Sent! 🎉");
            setAmount("");
            setNote("");
          } catch (err) {
            console.error(err);
            setStatus("error");
            setMessage((err as { message?: string })?.message || "Something went wrong.");
          } finally {
            setTimeout(() => setStatus("idle"), 1200);
          }
        }}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-6 sm:p-8 space-y-6"
      >
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Add spending</h1>
        </header>

        <div className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium text-slate-700">Amount</span>
            <div className="mt-1 relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 select-none">
                PLN
              </span>
              <input
                inputMode="decimal"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={status === "loading"}
                className="block w-full rounded-xl border border-slate-300 pl-12 pr-3 py-2.5 text-base text-slate-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-sky-500 transition disabled:bg-slate-100"
              />
            </div>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700">Note (optional)</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={status === "loading"}
              className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base text-slate-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-sky-500 transition disabled:bg-slate-100"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!isValid || status === "loading"}
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-white font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300 transition"
          >
            {status === "loading" ? (
              <svg
                className="h-5 w-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            ) : (
              <span>Send</span>
            )}
          </button>

          {message && (
            <span
              className={
                "text-sm " +
                (status === "success"
                  ? "text-emerald-600"
                  : status === "error"
                  ? "text-rose-600"
                  : "text-slate-500")
              }
            >
              {message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
