#!/bin/sh
set -e

echo "Starting Keycloak initialization script..."

# Start Keycloak in the background
/opt/keycloak/bin/kc.sh start-dev &

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to be ready..."
sleep 30
echo "Proceeding with configuration..."

# Log in to admin console
echo "Logging in to Keycloak admin console..."
/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user $KEYCLOAK_ADMIN --password $KEYCLOAK_ADMIN_PASSWORD

# Check if realm exists
echo "Checking if realm $KEYCLOAK_REALM exists..."
REALM_EXISTS=$(/opt/keycloak/bin/kcadm.sh get realms/$KEYCLOAK_REALM > /dev/null 2>&1 && echo "true" || echo "false")

if [ "$REALM_EXISTS" = "false" ]; then
  echo "Creating realm $KEYCLOAK_REALM..."
  /opt/keycloak/bin/kcadm.sh create realms -s realm=$KEYCLOAK_REALM -s enabled=true
  
  # Create admin role
  echo "Creating admin role: $KEYCLOAK_ADMIN_ROLE"
  /opt/keycloak/bin/kcadm.sh create roles -r $KEYCLOAK_REALM -s name=$KEYCLOAK_ADMIN_ROLE -s description="Administrator role with full access to all collections"
  
  # Create collection roles
  echo "Creating collection roles from: $KEYCLOAK_COLLECTION_ROLES"
  IFS=',' read -ra ROLES <<< "$KEYCLOAK_COLLECTION_ROLES"
  for role in "${ROLES[@]}"; do
    echo "Creating role $role"
    /opt/keycloak/bin/kcadm.sh create roles -r $KEYCLOAK_REALM -s name=$role -s description="Access to $role collection"
  done
  
  # Create SPA client
  echo "Creating SPA client: $KEYCLOAK_SPA_CLIENT_ID"
  SPA_CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh create clients -r $KEYCLOAK_REALM -s clientId=$KEYCLOAK_SPA_CLIENT_ID -s publicClient=true -s directAccessGrantsEnabled=true -s standardFlowEnabled=true -s redirectUris='["http://localhost:3000/*"]' -s webOrigins='["http://localhost:3000"]' -s name="STUF Single Page Application" -o)
  echo "SPA client created with ID: $SPA_CLIENT_ID"
  
  # Create API client
  echo "Creating API client: $KEYCLOAK_API_CLIENT_ID"
  API_CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh create clients -r $KEYCLOAK_REALM -s clientId=$KEYCLOAK_API_CLIENT_ID -s enabled=true -s clientAuthenticatorType=client-secret -s serviceAccountsEnabled=true -s name="STUF API Service" -o)
  echo "API client created with ID: $API_CLIENT_ID"
  
  # Set client secret
  echo "Setting client secret for API client"
  /opt/keycloak/bin/kcadm.sh update clients/$API_CLIENT_ID -r $KEYCLOAK_REALM -s "secret=$KEYCLOAK_API_CLIENT_SECRET"
  
  # Create admin user
  echo "Creating admin user..."
  /opt/keycloak/bin/kcadm.sh create users -r $KEYCLOAK_REALM -s username=admin -s enabled=true -s email=admin@example.com -s firstName=Admin -s lastName=User
  /opt/keycloak/bin/kcadm.sh set-password -r $KEYCLOAK_REALM --username admin --new-password password --temporary false
  /opt/keycloak/bin/kcadm.sh add-roles -r $KEYCLOAK_REALM --uusername admin --rolename $KEYCLOAK_ADMIN_ROLE
  
  # Create testuser for SPA authentication
  echo "Creating testuser..."
  /opt/keycloak/bin/kcadm.sh create users -r $KEYCLOAK_REALM -s username=testuser -s enabled=true -s email=testuser@example.com -s firstName=Test -s lastName=User
  /opt/keycloak/bin/kcadm.sh set-password -r $KEYCLOAK_REALM --username testuser --new-password password --temporary false
  /opt/keycloak/bin/kcadm.sh add-roles -r $KEYCLOAK_REALM --uusername testuser --rolename collection-test
  
  echo "Realm setup complete!"
else
  echo "Realm $KEYCLOAK_REALM already exists, skipping configuration."
fi

# Import test realm if it doesn't exist
echo "Checking if test realm exists..."
TESTREALM_EXISTS=$(/opt/keycloak/bin/kcadm.sh get realms/stuf-test > /dev/null 2>&1 && echo "true" || echo "false")

if [ "$TESTREALM_EXISTS" = "false" ]; then
  echo "Importing test realm..."
  /opt/keycloak/bin/kcadm.sh create realms -f /opt/keycloak/test-realm-export.json
  echo "Test realm setup complete!"
else
  echo "Test realm already exists, skipping configuration."
fi

# Keep the script running to keep the container running
wait
