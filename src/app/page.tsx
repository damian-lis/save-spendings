"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "spend_secret";
const HEADER_NAME = "X-Shared-Secret";

export default function Home() {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [secretInput, setSecretInput] = useState("");

  // Load secret from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSecret(saved);
      else setShowSecretDialog(true);
    } catch {
      // If localStorage not available (rare), just ask each time
      setShowSecretDialog(true);
    }
  }, []);

  const isValidAmount = (() => {
    if (!amount) return false;
    const n = Number(amount);
    return Number.isFinite(n) && n > 0;
  })();

  async function ensureSecret(): Promise<string | null> {
    if (secret) return secret;
    setShowSecretDialog(true);
    return null;
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!isValidAmount || status === "loading") return;

    const s = await ensureSecret();
    if (!s) return;

    console.log({ [HEADER_NAME]: s });

    try {
      setStatus("loading");
      setMessage("");
      const res = await fetch("/api/send-to-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [HEADER_NAME]: s,
        },
        body: JSON.stringify({
          value: Number(amount),
          note: note?.trim() || undefined,
        }),
      });

      if (res.status === 401) {
        // Secret invalid or expired: clear and reprompt
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        setSecret(null);
        setShowSecretDialog(true);
        throw new Error("Unauthorized: invalid secret.");
      }

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
  }

  function saveSecretAndClose() {
    const trimmed = secretInput.trim();
    if (!trimmed) return;
    try {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } catch {}
    setSecret(trimmed);
    setSecretInput("");
    setShowSecretDialog(false);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      {/* Secret dialog */}
      {showSecretDialog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Enter access key</h2>
            <p className="text-sm text-slate-600">
              This protects the form. Your key is stored locally in your browser.
            </p>
            <input
              type="password"
              autoFocus
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base text-slate-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-sky-500"
              placeholder="••••••••"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSecretDialog(false)}
                className="rounded-xl px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={saveSecretAndClose}
                className="rounded-xl px-4 py-2.5 text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300"
              >
                Save key
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={submit}
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
            disabled={!isValidAmount || status === "loading"}
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
