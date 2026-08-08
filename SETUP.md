# Background Remover — Go-Live Guide

Two independent tools, as requested:

| | Free tier | Pro tier |
|---|---|---|
| Where it runs | User's browser | Your GPU on Google Cloud Run |
| Model | U2Net / RMBG-1.4 (ONNX) | BiRefNet (MIT license, SOTA matting) |
| Cost per image | $0 | ~₹0.05–0.15 (see cost math below) |
| Quality | Good on clean backgrounds | Remove.bg-level, handles hair/fur/edges |
| Third-party API used | None | None — it's your own container |

---

## Part 1 — Free tier (client-side)

1. `npm install onnxruntime-web`
2. Export + quantize U2Net (or RMBG-1.4 for prototyping) to ONNX — see
   `free-tier/README.md` for exact commands.
3. Drop the `.onnx` file in `public/models/`.
4. Add the COOP/COEP headers in `next.config.js` (see README).
5. Import `<BackgroundRemover />` from `free-tier/BackgroundRemover.tsx`
   into your tool page.

Done — this ships as part of your normal Vercel deploy, no extra infra.

---

## Part 2 — Pro tier (Google Cloud Run + GPU)

### Step 1: One-time GCP setup
```bash
gcloud auth login
gcloud projects create zeperai-bg-remover --name="ZeperAI BG Remover"
# or use your existing project
gcloud config set project <your-project-id>
gcloud billing projects link <your-project-id> --billing-account=<your-billing-account-id>
```

### Step 2: Deploy the inference service
```bash
cd pro-tier
chmod +x deploy.sh
# edit PROJECT_ID and REGION at the top of deploy.sh first
./deploy.sh
```

This builds the Docker image via Cloud Build, pushes it to Artifact
Registry, and deploys to Cloud Run with an attached NVIDIA L4 GPU. It
prints your `INTERNAL_API_KEY` and service URL at the end — save both.

**Cloud Run GPU availability**: currently in `us-central1`, `europe-west1`,
`europe-west4`, and a few others — check `gcloud run` docs for the current
region list before deploying, as this expands over time.

### Step 3: Wire up your Next.js app (Vercel)

Add to your Vercel project env vars:
```
BG_REMOVER_PRO_URL=https://zeperai-bg-remover-pro-xxxxx.a.run.app
BG_REMOVER_INTERNAL_KEY=<the key deploy.sh printed>
```

Copy `nextjs-integration/route.ts` to `app/api/remove-background-pro/route.ts`
and `nextjs-integration/BackgroundRemoverPro.tsx` into your components
folder. Wire in your existing `requireAuth` + credit-check logic (marked
with comments in `route.ts`) so only Pro-plan/credit users can hit it.

### Step 4: Test end-to-end
```bash
curl -X POST https://<your-cloud-run-url>/remove-background \
  -H "x-internal-key: <your-key>" \
  -F "file=@test-product.jpg" \
  --output result.png
```

---

## Cost math (Cloud Run GPU, L4)

- L4 GPU on Cloud Run: ~$0.71/hr while active (pay-per-second billing,
  scales to zero when idle — `min-instances 0` in deploy.sh).
- BiRefNet inference: roughly 1–2s per image on an L4.
- At 2s/image: ~1,800 images/hour of GPU-active time → **~$0.0004/image**
  in raw GPU cost. Even with cold-start overhead and low utilization,
  you're well under ₹1/image, giving you very healthy margin against
  whatever you price the Pro credits at.

**Cold starts**: with `min-instances 0`, the first request after idle time
pulls the container + loads the model (~20-40s). Two options:
- Keep `min-instances 0` and show a "warming up…" state in the UI for the
  first request of a session (cheapest).
- Set `min-instances 1` once you have steady Pro traffic to eliminate cold
  starts entirely (~$500+/mo baseline cost — only worth it at volume).

---

## Licensing note

- **U2Net**: Apache-2.0, fully free for commercial use — recommended for
  your actually-free tier.
- **RMBG-1.4**: BRIA's non-commercial license — fine to prototype, not for
  a shipped free tier.
- **BiRefNet**: MIT license — fully free for commercial use, including
  running it yourself on Cloud Run as your Pro-tier engine.

This keeps both tiers legally clean for a commercial SaaS.
