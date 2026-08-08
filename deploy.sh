#!/usr/bin/env bash
# Deploy the Pro-tier background remover to Google Cloud Run with an L4 GPU.
# Prereqs: gcloud CLI installed + authenticated, billing enabled on the project.

set -euo pipefail

PROJECT_ID="your-gcp-project-id"        # <-- change this
REGION="us-central1"                     # GPU-enabled Cloud Run regions: us-central1, europe-west1, europe-west4, asia-southeast1 (check current list)
SERVICE_NAME="zeperai-bg-remover-pro"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
INTERNAL_API_KEY="$(openssl rand -hex 24)"   # generate once, save it, reuse in Next.js env too

echo "== 1. Set project =="
gcloud config set project "${PROJECT_ID}"

echo "== 2. Enable required APIs =="
gcloud services enable run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com

echo "== 3. Build & push the container via Cloud Build =="
gcloud builds submit --tag "${IMAGE}" --timeout=1800s .

echo "== 4. Deploy to Cloud Run with GPU =="
gcloud beta run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --gpu 1 \
  --gpu-type nvidia-l4 \
  --cpu 4 \
  --memory 16Gi \
  --min-instances 0 \
  --max-instances 3 \
  --concurrency 4 \
  --timeout 120 \
  --no-cpu-throttling \
  --set-env-vars "INTERNAL_API_KEY=${INTERNAL_API_KEY},ALLOWED_ORIGINS=https://zeperai.in" \
  --allow-unauthenticated

echo ""
echo "=================================================================="
echo "Deployed. Save this key — you need it in your Next.js env as well:"
echo "INTERNAL_API_KEY=${INTERNAL_API_KEY}"
echo "=================================================================="
echo ""
echo "Service URL:"
gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format 'value(status.url)'
