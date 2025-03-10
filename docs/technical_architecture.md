# Secure Trusted Upload Facility (STUF) - Technical Architecture

## System Architecture Overview

The STUF system consists of five main components that work together to provide a secure, reliable file upload facility:

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

### Core Components

1. **Single Page Application (SPA)**
   - User-facing interface for file uploads
   - Built with modern web technologies (React/Vue)
   - Responsive design for desktop and mobile devices
   - Handles client-side authentication flow
   - Communicates exclusively with the API service

2. **API Service**
   - Backend service built with Python (FastAPI/Flask)
   - Handles authentication verification
   - Processes file uploads and stores them in the bucket
   - Implements security controls and rate limiting
   - Sends notifications to Zulip for upload events

3. **Storage Bucket**
   - Cloud-based storage (AWS S3 or Azure Storage)
   - Stores uploaded files with encryption at rest
   - Contains system configuration data
   - Configured with appropriate access controls

4. **Pluggable Django App**
   - Can be deployed as standalone Django site (MVP) or integrated into Zulip server
   - Provides management interface for Trust Architects
   - Configures authorized users and system settings
   - Pushes configuration to the storage bucket
   - Uses its own authentication system when standalone, or leverages Zulip's authentication system when integrated

5. **Database**
   - Stores configuration and user information
   - May be the existing Zulip database with additional tables
   - Maintains audit logs and system state

## Security Architecture

### Authentication and Authorization

#### User Authentication Flow

1. **Initial Authentication**
   - User enters email in the SPA
   - API verifies email against authorized users list
   - For first-time users:
     - User must have previously received a "magic link" email from the Trust Architect
     - User must have clicked the link to verify email ownership before proceeding

2. **SMS Authentication**
   - API sends SMS with OTP to user's registered phone
   - User enters OTP in the SPA
   - API validates OTP and grants access token

3. **Session Management**
   - Access tokens have limited lifetime
   - Refresh tokens enable extended sessions
   - All tokens are revocable by administrators

#### Trust Architect Authentication

- TAs authenticate through Zulip's existing system
- Zulip's role-based access controls determine STUF admin access
- Optional additional authentication factors for admin functions

### Data Security

1. **Data in Transit**
   - All communications use TLS 1.2+
   - Certificate pinning in SPA for API connections
   - Strong cipher suites enforced

2. **Data at Rest**
   - Files encrypted in storage using AES-256
   - Encryption keys managed through cloud provider KMS
   - Optional customer-managed encryption keys

3. **Data Access Controls**
   - Least privilege principle for all components
   - Time-limited access tokens for file retrieval
   - Comprehensive audit logging of all access

### Security Controls

1. **Input Validation**
   - Strict validation of all user inputs
   - File type and content validation
   - Size limits and rate limiting

2. **Vulnerability Prevention**
   - Regular dependency updates
   - Automated security scanning in CI/CD
   - Penetration testing before major releases

3. **Monitoring and Detection**
   - Anomaly detection for unusual access patterns
   - Real-time alerts for security events
   - Integration with SIEM systems (optional)

## Integration Architecture

### Zulip Integration

1. **Authentication Integration**
   - When integrated with Zulip, STUF leverages Zulip's authentication system
   - Single sign-on for Trust Architects in integrated mode
   - Shared user session management in integrated mode
   - Standalone authentication system available for MVP and non-integrated deployments

2. **Notification Integration**
   - File upload events posted to configured Zulip streams
   - Interactive messages for administrative actions
   - Customizable notification templates

3. **Management Integration**
   - STUF admin interface embedded in Zulip
   - Consistent UI/UX with Zulip design patterns
   - Shared permission model

### Cloud Provider Integration

1. **Storage Integration**
   - Direct integration with AWS S3 or Azure Storage
   - Support for provider-specific features:
     - AWS: S3 Lifecycle policies, KMS integration
     - Azure: Blob Storage policies, Key Vault integration

2. **Identity Integration**
   - Optional integration with cloud identity providers
   - Support for AWS IAM and Azure AD
   - Role-based access control alignment

3. **Monitoring Integration**
   - Integration with CloudWatch or Azure Monitor
   - Custom metrics for system health
   - Alarm configuration for critical events

### External System Integration

1. **API-Based Integration**
   - RESTful API for programmatic integration
   - Webhook support for event notifications
   - OAuth2 for secure API access

2. **File Processing Integration**
   - Optional integration with file processing pipelines
   - Support for event-driven workflows
   - Customizable post-upload processing

## Data Flow Architecture

### Configuration Flow

1. Trust Architect configures STUF through Zulip interface
2. Django app stores configuration in database
3. Django app pushes configuration to storage bucket as JSON files:
   - `<bucket>/config/stuf_config.json` for main configuration
   - `<bucket>/config/metadata_config.json` for metadata field configuration
4. API service reads configuration from bucket at runtime
5. Changes to configuration are recorded in the journal (`<bucket>/journal/<timestamp>_<id>.json`)
6. API periodically checks for configuration updates and reloads when changes are detected

### Upload Flow

1. User authenticates through SPA
2. User selects file(s) to upload
3. SPA sends file(s) to API service
4. API validates request and user permissions
5. API stores file in bucket with appropriate structure:
   - `<bucket>/uploads/<id>/data/<file-name>` for the file content
   - `<bucket>/uploads/<id>/metadata.json` for upload metadata
   - Deletes `<bucket>/uploads.json` to trigger regeneration
   - Creates journal entry at `<bucket>/journal/<timestamp>_<id>.json`
6. API sends notification to Zulip
7. API returns success/failure to SPA

### Notification Flow

1. API service detects upload event
2. API formats notification message
3. API sends message to Zulip via API
4. Zulip delivers message to configured stream
5. Trust Architects receive real-time notification

## Deployment Architecture

The STUF architecture supports multiple deployment scenarios:

### Pyx-hosted Deployment

```
┌─────────────────────────────────────────────────┐
│                 Pyx Infrastructure               │
│                                                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────────┐  │
│  │         │    │         │    │             │  │
│  │  Zulip  │◄───┤   API   │◄───┤     SPA     │  │
│  │         │    │         │    │             │  │
│  └────┬────┘    └────┬────┘    └─────────────┘  │
│       │              │                          │
│  ┌────▼────┐    ┌────▼────┐                     │
│  │         │    │         │                     │
│  │ Database│    │ Storage │                     │
│  │         │    │         │                     │
│  └─────────┘    └─────────┘                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Self-hosted Deployment

```
┌─────────────────────────┐  ┌─────────────────────────────┐
│   Pyx Infrastructure    │  │    Customer Infrastructure   │
│                         │  │                             │
│  ┌─────────┐            │  │  ┌─────────┐  ┌─────────┐   │
│  │         │            │  │  │         │  │         │   │
│  │  Zulip  │◄───────────┼──┼──┤   API   │◄─┤   SPA   │   │
│  │         │            │  │  │         │  │         │   │
│  └─────────┘            │  │  └────┬────┘  └─────────┘   │
│                         │  │       │                     │
│                         │  │  ┌────▼────┐                │
│                         │  │  │         │                │
│                         │  │  │ Storage │                │
│                         │  │  │         │                │
│                         │  │  └─────────┘                │
│                         │  │                             │
└─────────────────────────┘  └─────────────────────────────┘
```

### Fully Self-hosted Deployment

```
┌─────────────────────────────────────────────────┐
│              Customer Infrastructure             │
│                                                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────────┐  │
│  │         │    │         │    │             │  │
│  │  Zulip  │◄───┤   API   │◄───┤     SPA     │  │
│  │         │    │         │    │             │  │
│  └────┬────┘    └────┬────┘    └─────────────┘  │
│       │              │                          │
│  ┌────▼────┐    ┌────▼────┐                     │
│  │         │    │         │                     │
│  │ Database│    │ Storage │                     │
│  │         │    │         │                     │
│  └─────────┘    └─────────┘                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Technologies
- **Framework**: React or Vue.js
- **State Management**: Redux or Vuex
- **UI Components**: Material-UI or Tailwind CSS
- **Build Tools**: Webpack, Babel
- **Testing**: Jest, Cypress

### Backend Technologies
- **Framework**: FastAPI or Flask
- **Authentication**: JWT, OTP libraries
- **File Handling**: Python file processing libraries
- **Cloud SDKs**: AWS SDK, Azure SDK
- **Testing**: Pytest, Postman

### Infrastructure Technologies
- **Containerization**: Docker
- **Orchestration**: Kubernetes (optional)
- **IaC**: Ansible, Terraform
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana

## Conclusion

The STUF technical architecture is designed to provide a secure, flexible, and maintainable system for handling sensitive file uploads. By separating concerns into distinct components and supporting multiple deployment scenarios, the architecture can accommodate a wide range of organizational needs while maintaining a consistent security model and user experience.
