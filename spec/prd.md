# Dynamic Collection Authorization System - Product SpecificatioAn

## Overview

Build a dynamic authorization system where users can access collections based on permissions defined in an OIDC Identity Provider (IDP). The system must be IDP-agnostic and support runtime discovery of collections and permissions.

## Architecture

**Components:**
- Single Page Application (SPA) - React/Vue/Angular frontend
- REST API - Backend service
- OIDC Identity Provider - Keycloak (reference), AWS Cognito, Azure Entra ID, or similar

**Flow:**
1. User clicks login in SPA → redirected to IDP
2. After authentication, user returns to SPA with access token
3. SPA extracts collection permissions from token claims
4. SPA dynamically renders UI based on discovered collections
5. SPA makes API calls with token for authorized operations
6. API validates token and trusts IDP for collection existence/permissions

## Authentication Flow

### OIDC Configuration
- **Response Type**: `code` (Authorization Code flow)
- **Required Scopes**: `openid myapp:access`
- **Optional Scopes**: Additional app-specific scopes as needed
- **Redirect URI**: `{spa_base_url}/auth/callback`

### Token Requirements
Access tokens must contain custom claims with collection permissions:

```json
{
  "sub": "user-123",
  "scope": "openid myapp:access",
  "aud": "your-app-client-id",
  "collections": {
    "catpics": ["read", "write"],
    "documents": ["read"],
    "memes": ["read", "write", "delete"]
  },
  "exp": 1625097600,
  "iat": 1625011200
}
```

## SPA Requirements

### Authentication Implementation
- Implement OIDC Authorization Code flow with PKCE
- Handle login redirect and token extraction from callback
- Store tokens securely (memory/sessionStorage, NOT localStorage)
- Implement token refresh logic

### Dynamic Collection Discovery
```javascript
// Extract collections from token
const collections = parseToken(accessToken).collections;

// Dynamically render UI
collections.forEach((collection, permissions) => {
  renderCollectionCard(collection, permissions);
});
```

### UI Behavior
- **No hardcoded collections** - discover all collections from token claims
- Show collections user has any permission for
- Enable/disable actions based on specific permissions:
  - Show "View" button if user has `read` permission
  - Show "Edit" button if user has `write` permission  
  - Show "Delete" button if user has `delete` permission
- Handle graceful degradation if token expires or permissions change

### API Integration
- Include `Authorization: Bearer {token}` header in all API calls
- Pass collection name and desired action in API requests
- Handle 401/403 responses appropriately

## API Requirements

### Token Validation
- Validate JWT signature against IDP's public keys
- Verify token expiration and audience claims
- Extract and parse `collections` claim

### Authorization Logic
```javascript
function authorizeCollectionAccess(token, collectionName, action) {
  const collections = token.collections || {};
  const permissions = collections[collectionName] || [];
  return permissions.includes(action);
}
```

### Dynamic Collection Management
- **Trust IDP as source of truth**: If token claims include a collection, consider it valid
- **Create collections on-demand**: If user requests authorized access to non-existent collection, create it
- **Collection operations**:
  - `GET /collections/{name}/items` - requires `read` permission
  - `POST /collections/{name}/items` - requires `write` permission  
  - `DELETE /collections/{name}/items/{id}` - requires `delete` permission
  - `GET /collections` - return list of collections user can access

### Error Handling
- Return 401 if token is invalid/expired
- Return 403 if user lacks required permission for collection/action
- Return 404 for collections user has no permissions for

## IDP Configuration Requirements

### Keycloak Setup
1. **Create Client Scope**: `collections-access`
2. **Add Protocol Mapper**:
   - Type: User Attribute Mapper
   - User Attribute: `collections` 
   - Token Claim Name: `collections`
   - Claim JSON Type: JSON
3. **Configure Client**: Add `collections-access` as default client scope
4. **User/Group Management**: Store collection permissions as user/group attributes

### Provider-Agnostic Requirements
The IDP must support:
- Custom claims in JWT access tokens
- User/group attribute storage
- Claim mapping configuration
- Standard OIDC Discovery endpoint (`/.well-known/openid-configuration`)

## Data Models

### Collection Permissions Structure
```typescript
interface CollectionPermissions {
  [collectionName: string]: Permission[];
}

type Permission = 'read' | 'write' | 'delete';

// Example
const userCollections: CollectionPermissions = {
  "catpics": ["read", "write"],
  "documents": ["read"],
  "admindata": ["read", "write", "delete"]
};
```

### API Endpoints
```
GET    /collections                    # List user's collections
GET    /collections/{name}/items       # Read collection items  
POST   /collections/{name}/items       # Create new item
PUT    /collections/{name}/items/{id}  # Update item
DELETE /collections/{name}/items/{id}  # Delete item
```

## Security Requirements

### Token Security
- Validate all tokens on every API request
- Use short token expiration (15-30 minutes)
- Implement proper token refresh flow
- Never trust client-side permissions without server validation

### Collection Access Control
- API must re-validate permissions from token on every request
- No caching of permissions in API (always trust current token)
- Log all collection access attempts for audit

## Testing Requirements

### Test Cases
1. **Authentication flow** - login, logout, token refresh
2. **Permission enforcement** - verify SPA hides unauthorized actions
3. **API authorization** - confirm API blocks unauthorized requests
4. **Dynamic discovery** - test with users having different collection sets
5. **Collection creation** - verify on-demand collection creation works
6. **IDP integration** - test with multiple identity provider types

### Test Data
Create test users with varying permission sets:
```json
// Power user
{"collections": {"catpics": ["read","write","delete"], "docs": ["read","write"]}}

// Read-only user  
{"collections": {"catpics": ["read"], "docs": ["read"]}}

// Limited access
{"collections": {"memes": ["read","write"]}}
```

## Success Criteria

- Users see only collections they have permissions for
- SPA UI adapts based on user's specific permissions per collection
- API creates new collections when authorized users access them
- System works identically regardless of IDP choice (Keycloak, Cognito, Entra ID)
- Zero hardcoded collection names in application code
- All authorization decisions made server-side based on token validation

## Implementation Priority

1. **Phase 1**: Basic OIDC integration + static collection permissions
2. **Phase 2**: Dynamic collection discovery from claims
3. **Phase 3**: On-demand collection creation  
4. **Phase 4**: IDP abstraction layer for multi-provider support