export const runtime = "nodejs"; // or "edge"

const SECRET_HEADER = "X-Shared-Secret";

/** Constant-time string compare that works in both node and edge runtimes */
function constantTimeEqual(a: string, b: string) {
  // Early reject on empty expected (misconfiguration)
  if (b.length === 0) return false;

  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  if (aa.length !== bb.length) return false;

  let diff = 0;
  for (let i = 0; i < aa.length; i++) {
    diff |= aa[i] ^ bb[i];
  }
  return diff === 0;
}

export async function POST(req: Request) {
  try {
    // --- Shared-secret validation ---
    const expected = process.env.SHARED_SECRET?.trim() ?? "";
    if (!expected) {
      // Prefer 500 to signal server misconfiguration rather than leaking policy
      return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500 });
    }

    const provided = (req.headers.get(SECRET_HEADER) || "").trim();
    console.log({ provided });
    if (!constantTimeEqual(provided, expected)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    // --- End secret check ---

    const { value, note = "" } = await req.json();
    if (!Number.isFinite(value)) {
      return new Response(JSON.stringify({ error: "`value` must be a finite number" }), {
        status: 400,
      });
    }

    const url = `${process.env.SHEET_URL}?token=${process.env.SHEET_TOKEN}`;

    const gsRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, note }),
    });

    const text = await gsRes.text();
    const data = text ? JSON.parse(text) : {};
    if (!gsRes.ok || data?.error) {
      return new Response(JSON.stringify({ error: data?.error || `HTTP ${gsRes.status}` }), {
        status: 502,
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as { message?: string })?.message || "Server error" }),
      { status: 500 }
    );
  }
}
