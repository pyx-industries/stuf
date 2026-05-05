#!/bin/sh
set -e

# Default values
DEFAULT_API_BASE_URL="http://localhost:8000"
DEFAULT_KEYCLOAK_URL="http://localhost:8080"
DEFAULT_KEYCLOAK_REALM="stuf"
DEFAULT_KEYCLOAK_CLIENT_ID="stuf-spa"

# Check for missing environment variables and warn
if [ -z "$API_URL" ]; then
  echo "WARNING: API_URL not set, using default: $DEFAULT_API_BASE_URL"
fi

if [ -z "$KEYCLOAK_URL" ] && [ -z "$OIDC_AUTHORITY" ]; then
  echo "WARNING: KEYCLOAK_URL not set, using default: $DEFAULT_KEYCLOAK_URL"
fi

if [ -z "$KEYCLOAK_REALM" ] && [ -z "$OIDC_AUTHORITY" ]; then
  echo "WARNING: KEYCLOAK_REALM not set, using default: $DEFAULT_KEYCLOAK_REALM"
fi

if [ -z "$KEYCLOAK_CLIENT_ID" ] && [ -z "$OIDC_CLIENT_ID" ]; then
  echo "WARNING: KEYCLOAK_CLIENT_ID not set, using default: $DEFAULT_KEYCLOAK_CLIENT_ID"
fi

# Get values from environment or use defaults
API_BASE_URL="${API_URL:-$DEFAULT_API_BASE_URL}"

# OIDC_AUTHORITY may be set directly (provider-agnostic) or computed from
# KEYCLOAK_URL + KEYCLOAK_REALM for backwards-compatible Keycloak deployments.
if [ -n "$OIDC_AUTHORITY" ]; then
  COMPUTED_OIDC_AUTHORITY="$OIDC_AUTHORITY"
else
  _KC_URL="${KEYCLOAK_URL:-$DEFAULT_KEYCLOAK_URL}"
  _KC_REALM="${KEYCLOAK_REALM:-$DEFAULT_KEYCLOAK_REALM}"
  COMPUTED_OIDC_AUTHORITY="${_KC_URL}/realms/${_KC_REALM}"
fi

COMPUTED_OIDC_CLIENT_ID="${OIDC_CLIENT_ID:-${KEYCLOAK_CLIENT_ID:-$DEFAULT_KEYCLOAK_CLIENT_ID}}"
COMPUTED_OIDC_SCOPE="${OIDC_SCOPE:-openid profile email stuf:access}"

# Determine the mode (dev or prod) - default to prod
MODE="${1:-prod}"

# Get port from environment or use default
SPA_PORT="${SPA_PORT:-3000}"

# Generate config.js in the appropriate location
if [ "$MODE" = "dev" ]; then
  # For development, Vite serves from public/
  mkdir -p /app/public
  CONFIG_PATH="/app/public/config.js"
else
  # For production, serve from build/
  CONFIG_PATH="/app/build/config.js"
fi

cat > "$CONFIG_PATH" <<EOF
window.__STUF_CONFIG__ = {
  apiBaseUrl: "$API_BASE_URL",
  oidcAuthority: "$COMPUTED_OIDC_AUTHORITY",
  oidcClientId: "$COMPUTED_OIDC_CLIENT_ID",
  oidcScope: "$COMPUTED_OIDC_SCOPE"
};
EOF

echo "Generated runtime configuration at $CONFIG_PATH:"
echo "  API Base URL: $API_BASE_URL"
echo "  OIDC Authority: $COMPUTED_OIDC_AUTHORITY"
echo "  OIDC Client ID: $COMPUTED_OIDC_CLIENT_ID"
echo "  OIDC Scope: $COMPUTED_OIDC_SCOPE"
echo "  Port: $SPA_PORT"

# Start the appropriate server based on mode
if [ "$MODE" = "dev" ]; then
  echo "Starting Vite dev server on port $SPA_PORT..."
  exec npm run dev -- --host 0.0.0.0 --port "$SPA_PORT"
else
  echo "Starting Vite preview server on port $SPA_PORT..."
  exec npm run preview -- --host 0.0.0.0 --port "$SPA_PORT"
fi
