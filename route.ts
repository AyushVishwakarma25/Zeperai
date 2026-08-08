// app/api/remove-background-pro/route.ts
//
// Bridges your Vercel-hosted Next.js app to your own Cloud Run GPU service.
// Handles: auth check (your app's users), credit/quota check, then proxies
// to the Cloud Run endpoint with the internal shared secret.

import { NextRequest, NextResponse } from "next/server";
// import { requireAuth } from "@/lib/auth"; // your existing middleware
// import { checkAndDeductCredit } from "@/lib/credits"; // your existing billing logic

const PRO_SERVICE_URL = process.env.BG_REMOVER_PRO_URL!; // Cloud Run service URL
const INTERNAL_API_KEY = process.env.BG_REMOVER_INTERNAL_KEY!; // same value set in deploy.sh

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout — pro inference can take a few sec

export async function POST(req: NextRequest) {
  try {
    // 1. Auth — reuse your existing requireAuth middleware here
    // const user = await requireAuth(req);
    // if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Plan/credit check — only Pro-plan users or users with credits get here
    // const hasCredit = await checkAndDeductCredit(user.id, "bg-remove-pro");
    // if (!hasCredit) {
    //   return NextResponse.json({ error: "No Pro credits remaining" }, { status: 402 });
    // }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large (max 15MB)" }, { status: 400 });
    }

    const proxyFormData = new FormData();
    proxyFormData.append("file", file);

    const upstream = await fetch(`${PRO_SERVICE_URL}/remove-background`, {
      method: "POST",
      headers: { "x-internal-key": INTERNAL_API_KEY },
      body: proxyFormData,
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      console.error("Pro bg-remover upstream error:", upstream.status, errText);
      return NextResponse.json(
        { error: "Background removal failed, please try again." },
        { status: 502 }
      );
    }

    const imageBuffer = await upstream.arrayBuffer();
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("remove-background-pro error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
