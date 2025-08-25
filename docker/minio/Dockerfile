FROM minio/minio:latest

# Install curl for healthcheck
USER root
RUN microdnf update -y && microdnf install -y curl && microdnf clean all

# Expose the default ports
EXPOSE 9000 9001

# Health check will be handled by Docker Compose
