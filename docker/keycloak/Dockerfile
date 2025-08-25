FROM quay.io/keycloak/keycloak:latest

# Install curl for healthcheck
USER root
RUN microdnf update -y && microdnf install -y curl && microdnf clean all
USER keycloak

# Add any custom configuration here
# COPY realm-export.json /opt/keycloak/data/import/

# Expose the default port
EXPOSE 8080

# Health check will be handled by Docker Compose
