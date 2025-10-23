# Secure Trusted Upload Facility (STUF) - MVP Specification

## Overview

This document outlines a simplified Minimum Viable Product (MVP) approach for the Secure Trusted Upload Facility (STUF), focusing on core functionality and leveraging existing solutions to reduce complexity.

## Simplified Architecture

The MVP architecture leverages an existing OIDC Identity Provider (Keycloak) to handle authentication and user management, allowing the application to focus on secure file uploads.

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│             │         │             │         │             │
│  React SPA  │────────►│ FastAPI API │────────►│  S3 Bucket  │
│   (RP)      │         │   (RP)      │         │             │
└──────┬──────┘         └──────┬──────┘         └─────────────┘
       │                       │
       │                       │
       └───────────┬───────────┘
                   │
                   ▼
           ┌─────────────┐         ┌─────────────┐
           │             │         │             │
           │  Keycloak   │         │   SQLite    │
           │    (IDP)    │         │  Database   │
           │             │         │             │
           └─────────────┘         └─────────────┘
```

### Key Components

1. **Frontend**: React Single Page Application (SPA)
   - Simple, intuitive interface
   - Acts as a Relying Party (RP) to Keycloak
   - Displays folders based on user roles

2. **Backend**: FastAPI
   - Lightweight, high-performance API
   - Validates tokens from Keycloak
   - Maps groups/roles to buckets/folders
   - Handles file uploads to S3

3. **Identity Provider**: Keycloak
   - Handles all authentication
   - Manages users, groups, and roles
   - Provides MFA capabilities
   - Issues JWT tokens with claims

4. **Storage**: S3-compatible bucket
   - Organized by project (group) and artifact type (role)
   - Secure access controls
   - Encryption at rest

5. **Database**: SQLite (for MVP)
   - Tracks upload metadata
   - Easily upgradable to PostgreSQL for production

## User Mental Model

The simplified user experience follows this mental model:

1. Go to the STUF application URL
2. Log in (handled by Keycloak)
3. See folders corresponding to assigned roles
4. Upload files to appropriate folders
5. View upload history

## User Stories

### Trust Architect

**User Story 1: Project Setup**
```
As a Trust Architect
I want to set up a new project with appropriate roles
So that participants can securely upload different types of artifacts

Acceptance Criteria:
1. Can create a new group in Keycloak for the project
2. Can define roles for different artifact types
3. Roles are reflected as folders in the storage system
4. Project setup is logged for audit purposes
```

**User Story 2: Participant Management**
```
As a Trust Architect
I want to manage project participants and their access
So that only authorized users can upload specific types of artifacts

Acceptance Criteria:
1. Can create user accounts in Keycloak
2. Can assign users to the project group
3. Can assign specific roles to users
4. Can disable access for specific users when needed
5. User management actions are logged for audit purposes
```

**User Story 3: File Access**
```
As a Trust Architect
I want to access all files uploaded to the project
So that I can review and process the submitted information

Acceptance Criteria:
1. Can view all folders in the project
2. Can download any file from any folder
3. Can see who uploaded each file and when
4. File access is logged for audit purposes
```

### Project Participant

**User Story 4: Authentication**
```
As a Project Participant
I want to securely log in to the STUF
So that I can upload files to the project

Acceptance Criteria:
1. Can log in using email/password
2. Can complete MFA if required
3. Login redirects to the STUF application
4. Session persists for a reasonable time
5. Can log out when finished
```

**User Story 5: File Upload**
```
As a Project Participant
I want to upload files to appropriate folders
So that I can share information with the project

Acceptance Criteria:
1. Can see folders corresponding to assigned roles
2. Can select files from local device
3. Can add basic metadata (title, description)
4. Can see upload progress
5. Receives confirmation when upload is complete
6. Upload is logged for audit purposes
```

**User Story 6: Upload History**
```
As a Project Participant
I want to view my upload history
So that I can track what I've shared with the project

Acceptance Criteria:
1. Can see a list of all files I've uploaded
2. List shows file name, date, and folder
3. Can filter or search my uploads
4. Cannot see uploads from other participants
```

## Technical Implementation

### Keycloak Configuration

1. **Realm Setup**
   - Create a dedicated realm for STUF
   - Configure realm settings (tokens, sessions, etc.)

2. **Client Configuration**
   - Create clients for SPA and API
   - Configure redirect URIs, scopes, etc.
   - Enable authorization services

3. **Group Structure**
   - Each project is a top-level group
   - Subgroups can be used for project phases/areas

4. **Role Structure**
   - Client roles for artifact types
   - Mapped to folders in storage

5. **User Management**
   - Manual creation or bulk import
   - Required attributes: email, phone
   - Group and role assignments

### FastAPI Implementation

1. **Authentication**
   - OIDC client configuration
   - JWT validation middleware
   - Role and group extraction

2. **Storage Integration**
   - S3 client configuration
   - Group-to-bucket mapping
   - Role-to-folder mapping
   - Presigned URLs for uploads

3. **Database Schema**
   - Upload records with metadata
   - User reference (from token)
   - File location and properties

4. **API Endpoints**
   - User info and permissions
   - Folder listing based on roles
   - File upload with metadata
   - Upload history

### React SPA Implementation

1. **Authentication Flow**
   - OIDC client integration
   - Login/logout handling
   - Token management

2. **UI Components**
   - Folder navigation based on roles
   - File upload with drag-and-drop
   - Upload progress indicators
   - History view with filters

3. **State Management**
   - User context with permissions
   - Upload status tracking
   - History data caching

## Deployment Options

### Local Development

```bash
# Run Keycloak
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev

# Run MinIO (S3-compatible storage)
docker run -p 9000:9000 -p 9001:9001 -e "MINIO_ROOT_USER=admin" -e "MINIO_ROOT_PASSWORD=password" minio/minio server /data --console-address ":9001"

# Run FastAPI backend
uvicorn app.main:app --reload

# Run React frontend
cd frontend && npm start
```

### Production Considerations

- Replace SQLite with PostgreSQL
- Use managed S3 service or self-hosted alternative
- Deploy Keycloak with high availability
- Use container orchestration (Kubernetes)
- Implement proper backup strategies

## Benefits of This Approach

1. **Reduced Complexity**
   - Leverages existing solutions for auth
   - Simple mental model for users
   - Focused on core functionality

2. **Faster Development**
   - No custom auth system to build
   - Standard patterns and libraries
   - Clear separation of concerns

3. **Security**
   - Professional auth implementation
   - Standard OIDC protocols
   - MFA support out of the box

4. **Flexibility**
   - Works with cloud or self-hosted
   - Scales from small to large projects
   - Supports future enhancements

## Future Enhancements

Once the MVP is established, these features could be added:

1. **Advanced Metadata**
   - Custom fields per project/role
   - Validation rules
   - Search capabilities

2. **Notifications**
   - Email alerts for new uploads
   - Integration with messaging platforms

3. **Audit and Compliance**
   - Comprehensive audit logging
   - Compliance reporting
   - Retention policies

4. **Advanced UI Features**
   - File previews
   - Commenting/discussion
   - Custom branding

## Conclusion

This MVP approach focuses on delivering core value (secure file uploads with proper access control) while leveraging existing solutions for authentication and user management. By simplifying the architecture and user experience, we can deliver a useful product faster and establish a solid foundation for future enhancements.
