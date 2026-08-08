"""
PRO TIER — Background Remover (self-hosted, your own model, your own server)
------------------------------------------------------------------------
Runs BiRefNet (fully open, MIT license) for remove.bg-grade quality:
clean hair strands, semi-transparency, fine edges.

This is YOUR OWN inference server — not a third-party API. You own the
model weights, the container, and the GPU it runs on (Google Cloud Run GPU).

Deploy target: Google Cloud Run with an attached NVIDIA L4 GPU.
"""

import io
import os
import time
import logging

import torch
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException, Header
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from torchvision import transforms
from transformers import AutoModelForImageSegmentation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bg-remover-pro")

app = FastAPI(title="ZeperAI Background Remover — Pro")

# Lock this down to your actual frontend domain(s) before going live
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "https://zeperai.in").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST"],
    allow_headers=["*"],
)

# Simple shared-secret auth between your Next.js backend and this service.
# Set the same value in both places via env vars / secret manager.
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY")

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_ID = os.environ.get("MODEL_ID", "ZhengPeng7/BiRefNet")  # MIT licensed, SOTA matting

_model = None
_transform = transforms.Compose([
    transforms.Resize((1024, 1024)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


def load_model():
    global _model
    if _model is None:
        logger.info(f"Loading {MODEL_ID} on {DEVICE} ...")
        _model = AutoModelForImageSegmentation.from_pretrained(
            MODEL_ID, trust_remote_code=True
        )
        _model.to(DEVICE)
        _model.eval()
        if DEVICE == "cuda":
            _model.half()  # fp16 for speed on L4
        logger.info("Model loaded.")
    return _model


@app.on_event("startup")
def warm_start():
    # Load the model at container startup so the first real request is fast.
    # (Cloud Run keeps min-instances warm to avoid cold-start reloading this.)
    load_model()


@app.get("/health")
def health():
    return {"status": "ok", "device": DEVICE, "model": MODEL_ID}


@app.post("/remove-background")
async def remove_background(
    file: UploadFile = File(...),
    x_internal_key: str | None = Header(default=None),
):
    if INTERNAL_API_KEY and x_internal_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if file.content_type not in ("image/png", "image/jpeg", "image/webp"):
        raise HTTPException(status_code=400, detail="Unsupported image type")

    contents = await file.read()
    max_bytes = 15 * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(status_code=400, detail="Image too large (max 15MB)")

    t0 = time.time()
    try:
        img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode image")

    orig_size = img.size
    model = load_model()

    input_tensor = _transform(img).unsqueeze(0).to(DEVICE)
    if DEVICE == "cuda":
        input_tensor = input_tensor.half()

    with torch.no_grad():
        preds = model(input_tensor)[-1].sigmoid().cpu()

    pred = preds[0].squeeze()
    mask = transforms.ToPILImage()(pred).resize(orig_size)

    rgba = img.convert("RGBA")
    rgba.putalpha(mask)

    out = io.BytesIO()
    rgba.save(out, format="PNG")
    out.seek(0)

    elapsed = time.time() - t0
    logger.info(f"Processed image in {elapsed:.2f}s on {DEVICE}")

    return Response(content=out.getvalue(), media_type="image/png")
