FROM quay.io/keycloak/keycloak:latest

COPY --chmod=755 init-keycloak.sh /opt/keycloak/bin/init-keycloak.sh
COPY test-realm-export.json /opt/keycloak/test-realm-export.json

ENTRYPOINT ["/bin/sh", "-c", "/opt/keycloak/bin/init-keycloak.sh"]
