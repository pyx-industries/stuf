# ============================================================================
# Base stage - shared dependencies and source
# ============================================================================
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# curl is used by the production HEALTHCHECK
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Run as a non-root user
RUN useradd --create-home --shell /bin/bash stuf

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=stuf:stuf . .

EXPOSE 8000

# ============================================================================
# Development stage - auto-reloading server for local hot-reloading.
# docker-compose.dev.yml mounts ./api over /app so edits reload live.
# ============================================================================
FROM base AS development

USER stuf

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ============================================================================
# Production stage - no --reload; multiple workers. This is the published
# image (`make build-containers` builds --target production). Ordered last so
# a target-less `docker build ./api` also yields the production image.
# ============================================================================
FROM base AS production

USER stuf

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
