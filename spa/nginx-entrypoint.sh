#!/bin/sh
# Writes window.__STUF_CONFIG__ into the nginx web root before nginx starts.
# Runs via /docker-entrypoint.d/ — nginx's own entrypoint calls scripts there.
set -e

if [ -f /bootstrap/generated.env ]; then
  set -a
  # shellcheck disable=SC1091
  . /bootstrap/generated.env
  set +a
fi

API_BASE_URL="${API_URL:-http://localhost:8000}"
OIDC_AUTHORITY="${OIDC_AUTHORITY:-http://localhost:8080}"
OIDC_CLIENT_ID="${ZITADEL_STUF_SPA_CLIENT_ID:-stuf-spa}"
OIDC_SCOPE="${OIDC_SCOPE:-openid profile email urn:zitadel:iam:org:projects:roles}"
OIDC_LOAD_USER_INFO="${OIDC_LOAD_USER_INFO:-false}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__STUF_CONFIG__ = {
  apiBaseUrl: "$API_BASE_URL",
  oidcAuthority: "$OIDC_AUTHORITY",
  oidcClientId: "$OIDC_CLIENT_ID",
  oidcScope: "$OIDC_SCOPE",
  oidcLoadUserInfo: $OIDC_LOAD_USER_INFO
};
EOF
