# FastAPI Backend Dockerfile - Usando imagen con dependencias científicas
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libpq-dev \
    libgeos-dev \
    libproj-dev \
    libgdal-dev \
    gdal-bin \
    tesseract-ocr \
    tesseract-ocr-spa \
    libopencv-dev \
    python3-opencv \
    curl \
    wget \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install wheel support
RUN pip install --upgrade pip setuptools wheel

# Copy requirements and install Python dependencies
COPY requirements-wheels.txt ./
RUN pip install --no-cache-dir --prefer-binary -r requirements-wheels.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health/ || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]