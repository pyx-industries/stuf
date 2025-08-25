FROM minio/minio:latest

# Install curl for healthcheck
USER root
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

# Expose the default ports
EXPOSE 9000 9001

# Health check will be handled by Docker Compose
