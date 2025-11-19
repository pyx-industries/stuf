FROM quay.io/keycloak/keycloak:latest AS builder

# Enable health support
ENV KC_HEALTH_ENABLED=true

# Configure for development mode with optimizations
WORKDIR /opt/keycloak

# Build optimized image for faster startup with health checks enabled
RUN /opt/keycloak/bin/kc.sh build --health-enabled=true

FROM registry.access.redhat.com/ubi9 AS curl-installer
RUN mkdir -p /mnt/rootfs
RUN dnf install --installroot /mnt/rootfs curl --releasever 9 --setopt install_weak_deps=false --nodocs -y && \
    dnf --installroot /mnt/rootfs clean all && \
    rpm --root /mnt/rootfs -e --nodeps setup

FROM quay.io/keycloak/keycloak:latest

# Copy the optimized build from builder stage
COPY --from=builder /opt/keycloak/ /opt/keycloak/

# Install curl for development health checks using Keycloak-recommended pattern
# In production, external monitoring tools would handle health checks
COPY --from=curl-installer /mnt/rootfs /




# Use the standard Keycloak entrypoint
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
