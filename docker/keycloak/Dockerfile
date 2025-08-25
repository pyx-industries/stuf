FROM quay.io/keycloak/keycloak:latest

USER root
RUN microdnf install -y curl
USER 1000

COPY init-keycloak.sh /opt/keycloak/bin/init-keycloak.sh
RUN chmod +x /opt/keycloak/bin/init-keycloak.sh

ENTRYPOINT ["/bin/sh", "-c", "/opt/keycloak/bin/init-keycloak.sh"]
