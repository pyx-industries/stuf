FROM quay.io/keycloak/keycloak:latest

COPY --chmod=755 init-keycloak.sh /opt/keycloak/bin/init-keycloak.sh

ENTRYPOINT ["/bin/sh", "-c", "/opt/keycloak/bin/init-keycloak.sh"]
