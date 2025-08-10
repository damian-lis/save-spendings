export const runtime = "nodejs"; // or "edge"

export async function POST(req: Request) {
  try {
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
    const data: any = text ? JSON.parse(text) : {};
    if (!gsRes.ok || data?.error) {
      return new Response(JSON.stringify({ error: data?.error || `HTTP ${gsRes.status}` }), {
        status: 502,
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Server error" }), { status: 500 });
  }
}
