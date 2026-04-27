FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required by rembg
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the model to cache it in the Docker image
# This prevents downloading it on container start
RUN python -c "from rembg import new_session; session = new_session('bria')"

COPY main.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
