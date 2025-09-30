# Multi-stage build for Railway deployment
FROM python:3.11-slim as builder

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create and set working directory
WORKDIR /app

# Copy requirements first for better layer caching
COPY requirements.txt .
COPY uploads/requirements_pdf.txt ./uploads/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir -r uploads/requirements_pdf.txt

# Production stage
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8001 \
    HOST=0.0.0.0

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash --uid 1000 app

# Set working directory
WORKDIR /app

# Copy installed packages from builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY --chown=app:app . .

# Create data directories for Railway persistent storage
RUN mkdir -p /app/data/faq_database \
    /app/data/pdf_vectors \
    /app/data/embedding_models \
    /app/data/uploads \
    && chown -R app:app /app/data

# Create logs directory
RUN mkdir -p /app/logs && chown -R app:app /app/logs

# Switch to non-root user
USER app

# Expose port (Railway will override with PORT env var)
EXPOSE 8001

# Add health check endpoint
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8001}/health || exit 1

# Set default environment variables for Railway
ENV USE_SUPABASE=true \
    DEBUG=false \
    FAQ_DB_PATH=/app/data/faq_database \
    PDF_DB_PATH=/app/data/pdf_vectors \
    EMBEDDING_MODELS_PATH=/app/data/embedding_models

# Start the application
CMD ["python", "app.py"]

