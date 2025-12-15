# Service Account Authentication

This document describes how to use service accounts for programmatic API access in STUF.

## Overview

Service accounts provide a way for automated systems, scripts, and applications to authenticate with the STUF API without requiring interactive user login. Unlike regular user accounts, service accounts:

- Use client credentials flow instead of authorization code flow
- Are identified by `client_id` rather than username
- Can have different permission scopes
- Are designed for machine-to-machine authentication

## Authentication Flow

### User Authentication vs Service Account Authentication

| Aspect | User Authentication | Service Account Authentication |
|--------|-------------------|------------------------------|
| Flow Type | Authorization Code | Client Credentials |
| Identifier | `preferred_username` | `client_id` or `azp` |
| Token Claims | `email`, `name`, etc. | `scopes`, `description`, etc. |
| Interactive | Yes (browser login) | No (API-only) |

## Setting Up Service Accounts

### 1. Create Service Account in Keycloak

1. Access Keycloak Admin Console: `http://localhost:8080/admin`
2. Navigate to your realm (e.g., "stuf")
3. Go to **Clients** → **Create Client**
4. Configure the client:
   - **Client Type**: OpenID Connect
   - **Client ID**: `your-service-name` (e.g., `backup-service`)
   - **Client Authentication**: On
   - **Authorization**: Off
   - **Authentication Flow**: Service accounts roles

### 2. Configure Service Account Permissions

Add collections permissions to the service account's JWT claims:

1. In Keycloak, go to **Clients** → Your Service Account → **Client Scopes**
2. Add a custom claim for collections:
   ```json
   {
     "docs": ["read", "write", "delete"],
     "logs": ["read"],
     "backups": ["read", "write", "delete"]
   }
   ```

### 3. Assign Roles

Add appropriate roles to the service account:
- **Service-specific roles**: `backup`, `monitoring`, etc.
- **Collection roles**: `collection-docs`, `collection-logs`
- **Admin role** (if needed): `admin`

## API Usage

### Getting an Access Token

```bash
# Request token using client credentials
curl -X POST "http://localhost:8080/realms/stuf/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=backup-service" \
  -d "client_secret=your-client-secret"
```

Response:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6...",
  "expires_in": 300,
  "refresh_expires_in": 0,
  "token_type": "Bearer",
  "not-before-policy": 0,
  "scope": "read write delete"
}
```

### Using the Token

Include the token in API requests:

```bash
# Upload a file
curl -X POST "http://localhost:8000/api/files/docs" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@document.pdf" \
  -F "metadata={\"description\":\"Automated backup\"}"

# List files
curl "http://localhost:8000/api/files/docs" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get service account info
curl "http://localhost:8000/api/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Service Account Response Format

When calling `/api/me` with a service account token:

```json
{
  "type": "service_account",
  "client_id": "backup-service",
  "name": "Backup Service Account",
  "description": "Service account for automated backups",
  "roles": ["service", "backup-admin"],
  "collections": {
    "docs": ["read", "write", "delete"],
    "logs": ["read", "write", "delete"],
    "backups": ["read", "write", "delete"]
  },
  "scopes": ["read", "write", "delete", "admin"],
  "active": true
}
```

## Permissions Model

Service accounts follow the same collection-based permissions as users:

### Collection Permissions

| Permission | Allows |
|------------|--------|
| `read` | List and download files |
| `write` | Upload files |
| `delete` | Delete files |

### Admin Role

Service accounts with the `admin` role have global access across all collections.

### Scope-based Permissions

Service accounts can have OAuth2 scopes that further restrict their capabilities:

- `read`: Read access to files
- `write`: Write access for uploads
- `delete`: Delete access for file removal
- `admin`: Administrative operations

## Example Service Account Configurations

### Backup Service

```json
{
  "client_id": "backup-service",
  "roles": ["service", "backup"],
  "collections": {
    "docs": ["read", "write"],
    "logs": ["read"],
    "backups": ["read", "write", "delete"]
  },
  "scopes": ["read", "write", "delete"]
}
```

### Monitoring Service

```json
{
  "client_id": "monitoring-service", 
  "roles": ["service", "monitoring"],
  "collections": {
    "logs": ["read"],
    "metrics": ["read", "write"]
  },
  "scopes": ["read"]
}
```

### Admin Service

```json
{
  "client_id": "admin-service",
  "roles": ["service", "admin"],
  "collections": {},
  "scopes": ["read", "write", "delete", "admin"]
}
```

## Security Best Practices

### Token Management

1. **Store secrets securely**: Use environment variables or secret management systems
2. **Rotate credentials regularly**: Update client secrets periodically
3. **Use short-lived tokens**: Configure appropriate token expiration times
4. **Log service account activities**: Monitor API usage for security

### Permission Design

1. **Principle of least privilege**: Grant only necessary permissions
2. **Collection isolation**: Use collection-based permissions to separate data
3. **Scope restrictions**: Limit OAuth2 scopes to required operations
4. **Regular audits**: Review service account permissions periodically

### Example Environment Configuration

```bash
# Service account credentials
export BACKUP_SERVICE_CLIENT_ID="backup-service"
export BACKUP_SERVICE_CLIENT_SECRET="your-secret-here"
export KEYCLOAK_TOKEN_URL="http://localhost:8080/realms/stuf/protocol/openid-connect/token"
export STUF_API_URL="http://localhost:8000/api"
```

## Troubleshooting

### Common Issues

1. **Token validation fails**
   - Check client_id and client_secret
   - Verify Keycloak realm configuration
   - Ensure service account has proper roles

2. **Permission denied errors**
   - Verify collection permissions in JWT claims
   - Check if admin role is needed
   - Validate OAuth2 scopes

3. **Token type detection fails**
   - Ensure service account tokens have `azp` or `client_id` claims
   - Verify tokens don't have conflicting user claims

### Debug Endpoints

Check service account status:
```bash
curl "http://localhost:8000/api/me" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq
```

Inspect JWT token claims:
```bash
# Decode JWT payload (without verification)
echo "YOUR_TOKEN" | cut -d. -f2 | base64 -d | jq
```

## Migration from User Authentication

If migrating scripts from user authentication to service accounts:

1. **Replace user tokens** with service account tokens
2. **Update permission checks** for collection-based access
3. **Modify error handling** for service account-specific responses
4. **Update logging** to track service account activities

The API endpoints remain the same - only the authentication mechanism changes.