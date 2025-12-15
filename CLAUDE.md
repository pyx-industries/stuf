# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

STUF (Secure Trusted Upload Facility) is a secure file upload system consisting of:
- **FastAPI backend** (`api/`) for authentication and file management
- **React SPA** (`spa/`) for user interface
- **Docker Compose** setup with Keycloak authentication and MinIO object storage
- **Comprehensive documentation** using MkDocs

## Development Commands

### Testing
```bash
# Run unit and integration tests (default, excludes E2E)
make test

# Run specific test types
make test-unit          # Fast unit tests only
make test-integration   # Integration tests with mocked services
make test-e2e          # End-to-end tests (requires Docker services)
make test-all          # All tests including E2E
make test-cov          # Tests with coverage report
```

### Docker Environment
```bash
# Start full development environment
docker-compose up -d

# Stop and clean up
docker-compose down
docker-compose down -v  # Remove volumes/data
```

### Documentation
```bash
make docs     # Generate diagrams and build MkDocs site
make serve    # Start local docs server
make clean    # Remove generated files
```

### Frontend Development (spa/)
```bash
npm start     # Start React dev server
npm test      # Run React tests
npm run build # Production build
```

## Architecture

### API Layer (`api/`)
- **FastAPI application** with modular router organization
- **Keycloak integration** for OAuth2/OIDC authentication using JWT signature verification
- **Dual authentication support** for both user accounts and service accounts
- **Attribute-based authorization** with collection-level permissions stored in JWT collections claim
- **MinIO integration** for S3-compatible object storage
- **Dependency injection pattern** for authentication (`get_current_user`, `get_current_service_account`, `get_current_principal`, `require_role`) and storage (`MinioClient`)

### Key Files
- `api/main.py`: FastAPI app setup, CORS, and main endpoints
- `api/auth/middleware.py`: Authentication and authorization logic for users and service accounts
- `api/routers/files.py`: File management endpoints with collection-based access control
- `api/storage/minio.py`: S3-compatible storage abstraction
- `api/domain/models.py`: User and ServiceAccount models with AuthenticatedPrincipal protocol
- `spa/src/App.js`: React app with OIDC authentication flow

### Environment Configuration
All services configured via environment variables with development defaults:
- Keycloak realm/client configuration
- MinIO credentials and endpoints
- API/SPA port configuration

### Testing Structure
- **Unit tests** (`tests/unit/`): Fast, fully mocked
- **Integration tests** (`tests/integration/`): API tests with mocked external services
- **E2E tests** (`tests/e2e/`): Full workflow tests requiring Docker services
- **Shared fixtures** in `conftest.py` files for consistent test data

## Security Model

### Authentication Flow

#### User Authentication
1. React SPA uses `react-oidc-context` for Keycloak OIDC flow
2. FastAPI backend validates tokens via JWT signature verification against Keycloak public keys
3. Users must have appropriate collection permissions in their JWT collections claim or admin role

#### Service Account Authentication
1. External services use client credentials flow to obtain JWT tokens
2. FastAPI backend validates service account tokens using same JWT verification
3. Service accounts identified by `client_id`/`azp` instead of username
4. Service accounts follow same collection-based permission model

### File Organization
- Files organized by collections with attribute-based access
- Storage paths include username for organization: `{collection}/{username}/{filename}`
- Admin users have global access across all collections

### Collection-Based Multi-Tenancy
- Users can access multiple collections based on permissions in their JWT collections claim
- Collection-specific permissions prevent cross-collection access
- Admin role provides global access for management functions

## Dependencies and Versions

### API Requirements
- FastAPI >=0.104.0 with Uvicorn
- Keycloak integration via python-jose and requests
- MinIO client for S3-compatible storage
- Pydantic 2.3.0 for data validation

### Frontend Dependencies
- React 18 with react-scripts
- react-oidc-context for authentication
- react-router-dom for routing

## Development Workflow

### Authentication Setup
1. Keycloak auto-configures with realm `stuf` and test users
2. Default admin user: `admin@example.com` / `password`
3. Collection permissions stored in JWT collections claim as JSON: `{"collection-name": ["read", "write", "delete"]}`
4. Service accounts created as Keycloak clients with service account roles enabled
5. Both users and service accounts use same collection permission format

### File Upload Flow
1. User authenticates via Keycloak OIDC
2. Frontend uploads files with metadata to API
3. API validates permissions and stores in MinIO with user-specific paths
4. Metadata and audit information stored with files

### Testing Authentication
- Use `@pytest.fixture` for auth tokens in tests
- Mock Keycloak responses for unit tests
- E2E tests use real Keycloak instance
- Test both user and service account authentication flows
- Service account tokens can be generated using client credentials flow

## Service Endpoints

### Development URLs
- SPA: http://localhost:3000
- API: http://localhost:8000
- Keycloak Admin: http://localhost:8080/admin (admin/admin)
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

### API Endpoints
- `GET /api/health`: Health check
- `GET /api/me`: Current user/service account info
- `POST /api/files/upload`: File upload with collection and metadata
- `GET /api/files/list/{collection}`: List files in collection
- `GET /api/files/download/{collection}/{path}`: Stream file download
- `DELETE /api/files/{collection}/{object}`: Delete file (admin only)

All endpoints support both user and service account authentication via Bearer token.

## File Organization Notes
- **spec/**: Contains important org-mode files for project planning and specifications - DO NOT DELETE

## Git Commit Guidelines
- NEVER use emojis in commit messages
- NEVER advertise Claude Code in commit messages
- Use clear, descriptive commit messages following conventional commit format
- Keep commits focused on a single change or feature
