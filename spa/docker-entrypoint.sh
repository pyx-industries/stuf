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

if [ -z "$KEYCLOAK_URL" ]; then
  echo "WARNING: KEYCLOAK_URL not set, using default: $DEFAULT_KEYCLOAK_URL"
fi

if [ -z "$KEYCLOAK_REALM" ]; then
  echo "WARNING: KEYCLOAK_REALM not set, using default: $DEFAULT_KEYCLOAK_REALM"
fi

if [ -z "$KEYCLOAK_CLIENT_ID" ]; then
  echo "WARNING: KEYCLOAK_CLIENT_ID not set, using default: $DEFAULT_KEYCLOAK_CLIENT_ID"
fi

# Get values from environment or use defaults
API_BASE_URL="${API_URL:-$DEFAULT_API_BASE_URL}"
KEYCLOAK_URL="${KEYCLOAK_URL:-$DEFAULT_KEYCLOAK_URL}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-$DEFAULT_KEYCLOAK_REALM}"
KEYCLOAK_CLIENT_ID="${KEYCLOAK_CLIENT_ID:-$DEFAULT_KEYCLOAK_CLIENT_ID}"

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
  keycloakUrl: "$KEYCLOAK_URL",
  keycloakRealm: "$KEYCLOAK_REALM",
  keycloakClientId: "$KEYCLOAK_CLIENT_ID"
};
EOF

echo "Generated runtime configuration at $CONFIG_PATH:"
echo "  API Base URL: $API_BASE_URL"
echo "  Keycloak URL: $KEYCLOAK_URL"
echo "  Keycloak Realm: $KEYCLOAK_REALM"
echo "  Keycloak Client ID: $KEYCLOAK_CLIENT_ID"
echo "  Port: $SPA_PORT"

# Start the appropriate server based on mode
if [ "$MODE" = "dev" ]; then
  echo "Starting Vite dev server on port $SPA_PORT..."
  exec npm run dev -- --host 0.0.0.0 --port "$SPA_PORT"
else
  echo "Starting Vite preview server on port $SPA_PORT..."
  exec npm run preview -- --host 0.0.0.0 --port "$SPA_PORT"
fi
