# Secure Trusted Upload Facility (STUF) - System Design

![STUF C4 Context Diagram](img/stuf_c4_context_diagram.png)

## Architecture Overview

The STUF system consists of five main components:

1. **Single Page Application (SPA)** - The frontend user interface
2. **API Service** - Backend service handling authentication and file uploads
3. **Storage Bucket** - AWS S3 or Azure Storage for file storage and configuration
4. **Pluggable Django App** - Management interface for Trust Architects
5. **Database** - Stores system configuration and user information

```
                   ┌─────────────┐
                   │             │
                   │     SPA     │
                   │             │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐         ┌─────────────┐
                   │             │         │             │
                   │     API     │─────────►   Storage   │
                   │             │         │   Bucket    │
                   └─────────────┘         │             │
                                           └──────▲──────┘
                                                  │
                   ┌─────────────┐         ┌──────┴──────┐
                   │             │         │             │
                   │  Database   │◄────────┤  Django App │
                   │             │         │             │
                   └─────────────┘         └─────────────┘
```

## Component Details

### 1. Single Page Application (SPA)
- Provides the user interface for file uploads
- Handles client-side authentication flow
- Communicates with the API service for all operations
- Built with modern web technologies (React, Vue, etc.)
- Deployed as static assets on a CDN or web server

### 2. API Service
- Built with Python using FastAPI or Flask
- Deployed as AWS Lambda, Azure Functions, or containerized application
- Handles authentication verification
- Processes file uploads and stores them in the bucket
- Reads configuration from the storage bucket
- Sends notifications to Zulip for upload events
- Implements rate limiting and security controls

### 3. Storage Bucket
- AWS S3 bucket or Azure Storage account
- Stores uploaded files with appropriate encryption
- Contains system configuration data
- Serves as the configuration source for the API service
- Configured with appropriate access controls and policies

### 4. Pluggable Django App
- Integrated into the existing Zulip server (Django-based)
- Provides the STUF management interface for Trust Architects
- Allows configuration of:
  - Authorized users (email + phone number pairs)
  - Storage settings
  - Notification settings
- Pushes configuration changes to the storage bucket
- Leverages Zulip's existing authentication system

### 5. Database
- Utilized by the Django app for configuration storage
- Stores user information and system settings
- May be the existing Zulip database with additional tables

## Authentication Flow

### User Authentication
1. User enters email in the SPA
2. API verifies email against authorized users list in the bucket
3. For first-time users:
   - API sends a "magic link" email
   - User clicks the link to verify email ownership
4. API sends SMS with OTP to the user's registered phone
5. User enters OTP in the SPA
6. API validates OTP and grants access token
7. SPA uses access token for upload operations

### Trust Architect Authentication
- Trust Architects authenticate through the existing Zulip authentication system
- Once authenticated, they have access to the SUF management interface
- No additional authentication is required beyond Zulip login

## Data Flow

### Configuration Flow
1. Trust Architect creates storage bucket out-of-band
2. Trust Architect authenticates to Zulip
3. Trust Architect accesses the STUF management app
4. Trust Architect uploads bucket credentials to the management app
5. Trust Architect configures authorized users and other settings
6. Django app pushes configuration to the storage bucket
7. API reads configuration from the bucket

### Upload Flow
1. User authenticates through the SPA
2. User selects file(s) to upload
3. SPA sends file(s) to the API
4. API validates the request and user permissions
5. API stores the file in the bucket
6. API sends notification to Zulip
7. API returns success/failure to the SPA

## Security Considerations

- All communications use TLS/SSL
- API implements rate limiting for authentication attempts
- Storage bucket configured with appropriate access policies
- File scanning for malware before storage
- Audit logging of all system activities
- Secure storage of credentials and sensitive configuration
- Session management with appropriate timeouts
- CORS policies to restrict API access

## Implementation Plan

1. **Phase 1: Infrastructure Setup**
   - Create storage bucket and configure security
   - Set up development environments
   - Define API contracts

2. **Phase 2: Core Components**
   - Develop Django pluggable app for Zulip
   - Implement API service with authentication
   - Create basic SPA with authentication flow

3. **Phase 3: Integration**
   - Connect Django app to storage bucket
   - Implement file upload in API and SPA
   - Set up notification system

4. **Phase 4: Security & Testing**
   - Implement security controls and audit logging
   - Conduct security review
   - User acceptance testing

5. **Phase 5: Deployment**
   - Deploy to production environment
   - Monitor and optimize performance
   - Document system for users and administrators
