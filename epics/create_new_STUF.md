# Epic: Create New Secure Trusted Upload Facility (STUF)

## Overview
As a Trust Architect (TA), I need to create a new Secure Trusted Upload Facility so that I can securely receive confidential files from project participants.

## User Story
**As a** Trust Architect  
**I want to** set up a new Secure Trusted Upload Facility  
**So that** I can securely receive confidential files from project participants

## MVP Implementation Note
For the MVP, the STUF Admin tool will be implemented as a standalone Django application with its own authentication system. This standalone approach provides immediate value while reducing initial complexity. The application will be designed with future Zulip integration in mind, but this integration will be implemented post-MVP.

The standalone MVP will focus on the core secure upload functionality, user management, and basic notification capabilities. It will implement the "code under glass" transparency approach from day one, providing Trust Architects with complete visibility into the deployed code and configuration.

While the long-term roadmap includes multiple deployment scenarios and deep Zulip integration, the MVP will establish a solid foundation that can evolve toward these goals in future iterations.

## Acceptance Criteria

### 1. STUF Configuration
- TA can authenticate to the STUF Admin tool (standalone or via Zulip credentials if integrated)
- TA can configure a new STUF with:
  - Project name and description
  - Authorized users list (project participants who may not be Pyx platform users)
  - Zulip stream name and topic for notifications
  - GitHub username for repository access (optional)
  - Metadata configuration:
    - Enable/disable each metadata type based on project requirements
    - For each enabled metadata type:
      - File type configuration (optional):
        - Predefined file type options
        - Whether "Don't know" or "Other (specify)" options are allowed
        - Whether file type selection is required
      - Collection configuration (optional):
        - Predefined collection options
        - Whether "Don't know" or "Other (specify)" options are allowed
        - Whether collection selection is required
      - IP ownership declaration configuration (optional):
        - Predefined ownership options
        - Whether free text entry is allowed
        - Whether "Don't know" option is allowed
        - Whether declaration is legally binding
        - Whether IP ownership declaration is required
      - License conditions configuration (optional):
        - Predefined license options
        - Whether free text entry is allowed
        - Whether "Don't know" option is allowed
        - Additional documentation requirements
        - Whether license condition declaration is required
      - Comment field configuration (optional):
        - Whether comments are required for all uploads
        - Whether comments are required for specific metadata selections

### 2. Infrastructure Provisioning
- System automatically creates a new GitHub repository for the STUF instance with naming convention `stuf-{project-slug}`
  - Repository is configured as private
  - Repository has minimal features enabled (no wiki, issues, projects, etc.)
  - Repository has branch protection rules for the main branch
- If TA provided a GitHub username, system grants read-only access to the repository
- System generates a unique S3-compatible storage bucket with appropriate permissions
- System configures DNS for `{project-slug}.stuf.pyx.io`
- System generates deployment configuration (Docker Compose) with appropriate environment variables
- System configures GitHub repository with necessary secrets for deployment:
  - Storage bucket credentials
  - Zulip API credentials
  - Deployment target credentials

### 3. Deployment
- System pushes initial code to the GitHub repository including:
  - STUF API and SPA code
  - Docker Compose configuration
  - GitHub Actions workflow for CI/CD
- GitHub Actions workflow automatically deploys the application to the target environment
- System verifies deployment success with health checks
- Django Admin tool is updated with STUF instance details (URL, repository link)
- API can read configuration from the storage bucket
- API can write uploaded files to the storage bucket
- API posts notifications with verification links to the configured Zulip stream/topic

### 4. Integration with Administration Tools
- STUF is properly registered with the Admin tool ecosystem
- STUF configuration is accessible through the Admin tool
- System establishes proper connections to related administration features:
  - Project participant management (see "Manage Project Participants" epic)
  - File access and download capabilities (see "Admin Tool Download Interface" epic)
- TA receives notification when STUF is ready for administration

## Detailed Flow

### Phase 1: Initial Configuration
1. TA logs into the STUF Admin tool (either standalone or via Zulip if integrated)
2. TA accesses the STUF creation interface
3. TA selects "Create New STUF" option
4. TA enters project details and configuration:
   - Project name and description
   - List of authorized users (CSV upload or manual entry)
   - Zulip stream and topic for notifications
   - GitHub username for repository access (optional)
5. TA submits the configuration
6. System validates the configuration

### Phase 2: Infrastructure Setup
1. System creates a new GitHub repository with naming convention `stuf-{project-slug}`
   - Repository is configured as private
   - Repository has minimal features enabled (no wiki, issues, projects, etc.)
   - Repository has branch protection rules for the main branch
   - If TA provided a GitHub username, system grants read-only access to the repository
2. System generates a unique S3-compatible storage bucket for the STUF
   - Creates initial bucket structure:
     - `<bucket>/uploads/` directory for uploaded files
     - `<bucket>/users/` directory for user information
     - `<bucket>/config/` directory for configuration
     - `<bucket>/journal/` directory for audit logs
   - Creates initial configuration files:
     - `<bucket>/config/stuf_config.json` with basic STUF configuration
     - `<bucket>/config/metadata_config.json` with metadata field configuration
3. System configures DNS entry for `{project-slug}.stuf.pyx.io`
4. System generates Docker Compose configuration with environment variables for:
   - Storage bucket credentials
   - API configuration
   - Zulip integration details
5. System configures GitHub repository with secrets:
   - `STORAGE_ACCESS_KEY` and `STORAGE_SECRET_KEY`
   - `ZULIP_API_KEY` and `ZULIP_URL`
   - `DEPLOYMENT_SSH_KEY` or other deployment credentials
6. System pushes base STUF code (API and SPA) to the repository
7. System configures GitHub Actions workflow for automated deployment

### Phase 3: Deployment
1. GitHub Actions workflow is triggered by the initial code push
2. Workflow builds Docker images for API and SPA
3. Workflow deploys the application using Docker Compose to the target environment
4. System performs health checks to verify successful deployment
5. System updates the Django Admin tool with:
   - STUF URL (`{project-slug}.stuf.pyx.io`)
   - GitHub repository URL
   - Storage bucket details (for monitoring)
6. System notifies the TA that the STUF is ready via Zulip

### Phase 4: Verification and Readiness
1. System posts a notification to Zulip with links to verify the new STUF:
   - Link to access the STUF admin interface
   - Link to perform a test upload
   - Link to view the GitHub repository
2. TA clicks the links to verify basic configuration and functionality
3. TA performs a test upload to verify core functionality
4. System posts a confirmation notification to Zulip when test upload succeeds
5. System provides documentation for the STUF instance
6. STUF is marked as ready for production use

## Technical Implementation Details

### Repository Structure
- API code (Python FastAPI/Flask)
- SPA code (React/Vue)
- Docker Compose configuration
- CI/CD workflows (GitHub Actions)
- Configuration templates

### CI/CD Pipeline
- When a PR is merged to the main branch:
  1. Code is tested
  2. Docker images for API/SPA are built
  3. Docker Compose deployment to production environment is triggered
  4. Health checks and post-deployment tests are run
  5. Notification is sent to the TA via Zulip

### Security Considerations
- All credentials are stored securely
- Infrastructure follows least-privilege principle
- All communications use TLS/SSL
- API implements rate limiting and other security controls
- Regular security audits are scheduled

## Dependencies
- Authentication system (standalone or Zulip-integrated)
- STUF Admin tool deployed as Django app
- AWS or Azure account with appropriate permissions
- GitHub organization with CI/CD capabilities
- DNS management for custom domains (optional)

## Risks and Mitigations
| Risk | Mitigation |
|------|------------|
| Cloud provider outage | Design for potential failover between providers |
| Security vulnerabilities | Regular security audits and updates |
| Configuration errors | Validation checks and automated testing |
| User adoption issues | Provide clear documentation and support |

## Timeline
- Configuration setup: 1 day
- Infrastructure provisioning: 1-2 days
- Deployment and testing: 1 day
- Total estimated time: 3-4 days
