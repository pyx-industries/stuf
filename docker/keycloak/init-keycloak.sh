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
  
  # Create client scope for collections
  echo "Creating client scope 'stuf:access'"
  /opt/keycloak/bin/kcadm.sh create client-scopes -r $KEYCLOAK_REALM -s name=stuf:access -s protocol=openid-connect
  
  # Create protocol mapper for collections claim
  echo "Creating 'collections' protocol mapper"
  echo "DEBUG: Getting client scopes..."
  /opt/keycloak/bin/kcadm.sh get client-scopes -r $KEYCLOAK_REALM
  echo "DEBUG: Getting client scopes with query..."
  /opt/keycloak/bin/kcadm.sh get client-scopes -r $KEYCLOAK_REALM --fields id,name | grep "stuf:access"
  STUF_SCOPE_UUID=$(/opt/keycloak/bin/kcadm.sh get client-scopes -r $KEYCLOAK_REALM --fields id,name | grep "stuf:access" | awk '{print $1}')
  echo "DEBUG: Extracted UUID: '$STUF_SCOPE_UUID'"
  echo "DEBUG: UUID length: ${#STUF_SCOPE_UUID}"
  echo "Using client scope UUID: $STUF_SCOPE_UUID"
  echo "DEBUG: About to run command: create client-scopes/$STUF_SCOPE_UUID/protocol-mappers/models"
  
  if [ -z "$STUF_SCOPE_UUID" ]; then
    echo "ERROR: STUF_SCOPE_UUID is empty! Cannot proceed."
    exit 1
  fi
  
  /opt/keycloak/bin/kcadm.sh create client-scopes/$STUF_SCOPE_UUID/protocol-mappers/models -r $KEYCLOAK_REALM \
    -s name=collections \
    -s protocol=openid-connect \
    -s protocolMapper=oidc-usermodel-attribute-mapper \
    -s config.\"user.attribute\"="collections" \
    -s config.\"claim.name\"="collections" \
    -s config.\"jsonType.label\"="JSON" \
    -s config.\"access.token.claim\"="true" \
    -s config.\"id.token.claim\"="true"
  
  # Create SPA client
  echo "Creating SPA client: $KEYCLOAK_SPA_CLIENT_ID"
  SPA_CLIENT_UUID=$(/opt/keycloak/bin/kcadm.sh create clients -r $KEYCLOAK_REALM -s clientId=$KEYCLOAK_SPA_CLIENT_ID -s publicClient=true -s directAccessGrantsEnabled=true -s standardFlowEnabled=true -s 'redirectUris=["http://localhost:3000/*"]' -s 'webOrigins=["http://localhost:3000"]' -s name="STUF Single Page Application" -i)
  echo "SPA client created with UUID: $SPA_CLIENT_UUID"
  
  # Create API client
  echo "Creating API client: $KEYCLOAK_API_CLIENT_ID"
  API_CLIENT_UUID=$(/opt/keycloak/bin/kcadm.sh create clients -r $KEYCLOAK_REALM -s clientId=$KEYCLOAK_API_CLIENT_ID -s enabled=true -s clientAuthenticatorType=client-secret -s serviceAccountsEnabled=true -s name="STUF API Service" -i)
  echo "API client created with UUID: $API_CLIENT_UUID"
  
  # Set client secret
  echo "Setting client secret for API client"
  /opt/keycloak/bin/kcadm.sh update clients/$API_CLIENT_UUID -r $KEYCLOAK_REALM -s "secret=$KEYCLOAK_API_CLIENT_SECRET"

  # Add stuf:access scope to clients
  echo "Adding 'stuf:access' scope to SPA client"
  /opt/keycloak/bin/kcadm.sh update clients/$SPA_CLIENT_UUID -r $KEYCLOAK_REALM --add-default-client-scope stuf:access
  
  echo "Adding 'stuf:access' scope to API client"
  /opt/keycloak/bin/kcadm.sh update clients/$API_CLIENT_UUID -r $KEYCLOAK_REALM --add-default-client-scope stuf:access
  
  # Create admin user
  echo "Creating admin user..."
  /opt/keycloak/bin/kcadm.sh create users -r $KEYCLOAK_REALM -s username=admin -s enabled=true -s email=admin@example.com -s firstName=Admin -s lastName=User
  /opt/keycloak/bin/kcadm.sh set-password -r $KEYCLOAK_REALM --username admin --new-password password --temporary false
  /opt/keycloak/bin/kcadm.sh add-roles -r $KEYCLOAK_REALM --uusername admin --rolename $KEYCLOAK_ADMIN_ROLE
  
  # Create testuser for SPA authentication
  echo "Creating testuser..."
  /opt/keycloak/bin/kcadm.sh create users -r $KEYCLOAK_REALM -s username=testuser -s enabled=true -s email=testuser@example.com -s firstName=Test -s lastName=User
  /opt/keycloak/bin/kcadm.sh set-password -r $KEYCLOAK_REALM --username testuser --new-password password --temporary false
  
  # Add collections attribute to testuser
  echo "Adding collections attribute to testuser..."
  TESTUSER_ID=$(/opt/keycloak/bin/kcadm.sh get users -r $KEYCLOAK_REALM -q username=testuser --fields id --format csv --noquotes)
  COLLECTIONS_JSON='{"collection-1-docs": ["read", "write"], "collection-2-contracts": ["read"], "collection-3-cat-pics": ["read", "write", "delete"]}'
  /opt/keycloak/bin/kcadm.sh update users/$TESTUSER_ID -r $KEYCLOAK_REALM -s "attributes.collections=$COLLECTIONS_JSON"
  
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
