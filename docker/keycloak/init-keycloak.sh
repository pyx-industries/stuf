#!/bin/sh
set -e

echo "Starting Keycloak initialization script..."

# Start Keycloak in the background
/opt/keycloak/bin/kc.sh start-dev &

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to be ready..."
for i in $(seq 1 60); do
  if curl -f http://localhost:8080/realms/master > /dev/null 2>&1; then
    echo "Keycloak is ready!"
    break
  fi
  echo "Waiting for Keycloak... attempt $i/60"
  sleep 5
done

# Verify Keycloak is actually ready
if ! curl -f http://localhost:8080/realms/master > /dev/null 2>&1; then
  echo "ERROR: Keycloak failed to start after 300 seconds"
  exit 1
fi

echo "Proceeding with configuration..."

# Log in to admin console
echo "Logging in to Keycloak admin console..."
/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user $KEYCLOAK_ADMIN --password $KEYCLOAK_ADMIN_PASSWORD

# Check if realm exists
echo "Checking if realm $KEYCLOAK_REALM exists..."
REALM_EXISTS=$(/opt/keycloak/bin/kcadm.sh get realms/$KEYCLOAK_REALM > /dev/null 2>&1 && echo "true" || echo "false")

if [ "$REALM_EXISTS" = "false" ]; then
  echo "Importing realm from JSON configuration..."
  /opt/keycloak/bin/kcadm.sh create realms -f /opt/keycloak/data/import/realm-export.json
  echo "Realm setup complete!"
else
  echo "Realm $KEYCLOAK_REALM already exists, skipping configuration."
fi

# Keep the script running to keep the container running
wait
