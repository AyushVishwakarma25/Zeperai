# CUDA 12.1 base with cuDNN, matches torch==2.3.1+cu121
FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 python3-pip python3.11-dev \
    libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN ln -sf /usr/bin/python3.11 /usr/bin/python

WORKDIR /app

COPY requirements.txt .
# Install torch with CUDA 12.1 wheels explicitly, then the rest
RUN pip install --no-cache-dir torch==2.3.1 torchvision==0.18.1 \
    --index-url https://download.pytorch.org/whl/cu121
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Model weights are pulled from Hugging Face on first startup and cached
# in the image layer below if you bake them in (recommended — see note).
# For faster cold starts, uncomment to pre-download at build time:
# RUN python -c "from transformers import AutoModelForImageSegmentation; \
#     AutoModelForImageSegmentation.from_pretrained('ZhengPeng7/BiRefNet', trust_remote_code=True)"

ENV HF_HOME=/app/.cache/huggingface

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
