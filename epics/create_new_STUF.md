# Epic: Create New Secure Trusted Upload Facility (STUF)

## Overview
As a Trust Architect (TA), I need to create a new Secure Trusted Upload Facility so that I can securely receive confidential files from project participants.

## User Story
**As a** Trust Architect  
**I want to** set up a new Secure Trusted Upload Facility  
**So that** I can securely receive confidential files from project participants

## Acceptance Criteria

### 1. STUF Configuration
- TA can authenticate to the STUF Admin tool using Zulip credentials
- TA can configure a new STUF with:
  - Project name and description
  - Storage bucket details (AWS/Azure)
  - Authorized users list (email + phone pairs)
  - Zulip channel for notifications
  - Custom branding elements (optional)

### 2. Infrastructure Provisioning
- System automatically creates a new GitHub repository for the STUF instance
- System pushes STUF API and SPA code to the repository
- System generates Ansible scripts for infrastructure provisioning
- Infrastructure is provisioned according to specifications
- CI/CD workflows are configured in the GitHub repository

### 3. Deployment
- STUF API and SPA are deployed to the provisioned infrastructure
- STUF Admin tool can connect to the storage bucket
- API can read configuration from the bucket
- API can write uploaded files to the bucket
- API posts notifications to the configured Zulip channel

### 4. Administration
- TA can manage the STUF configuration through the Admin tool
- TA can view and download files that have been uploaded
- TA can modify the authorized users list
- TA can monitor upload events via Zulip notifications

## Detailed Flow

### Phase 1: Initial Configuration
1. TA logs into Zulip server
2. TA accesses the STUF Admin tool
3. TA selects "Create New STUF" option
4. TA enters project details and configuration:
   - Project name and description
   - Storage provider (AWS S3 or Azure Storage)
   - Bucket credentials (created out-of-band)
   - List of authorized users (CSV upload or manual entry)
   - Zulip channel for notifications
5. TA submits the configuration
6. System validates the configuration

### Phase 2: Infrastructure Setup
1. System creates a new GitHub repository with naming convention `stuf-{project-name}`
2. System pushes base STUF code (API and SPA) to the repository
3. System generates project-specific configuration files
4. System creates Ansible scripts for infrastructure provisioning
5. System triggers infrastructure provisioning workflow
6. Infrastructure components are created:
   - API hosting environment (Lambda/Functions/Container)
   - SPA hosting environment (CDN/Static site)
   - Networking and security configurations
7. System configures CI/CD workflows in the GitHub repository

### Phase 3: Deployment
1. System deploys the STUF API to the provisioned infrastructure
2. System deploys the STUF SPA to the provisioned infrastructure
3. System configures the API with bucket access credentials
4. System configures the API with Zulip notification credentials
5. System updates the STUF Admin tool with connection details
6. System performs validation tests on the deployment
7. System notifies the TA that the STUF is ready

### Phase 4: Verification and Handover
1. TA accesses the STUF Admin tool to verify configuration
2. TA performs a test upload to verify functionality
3. TA verifies Zulip notifications are working
4. TA receives documentation for the STUF instance
5. STUF is now ready for production use

## Technical Implementation Details

### Repository Structure
- API code (Python FastAPI/Flask)
- SPA code (React/Vue)
- Infrastructure as Code (Ansible/Terraform)
- CI/CD workflows (GitHub Actions)
- Configuration templates

### CI/CD Pipeline
- When a PR is merged to the main branch:
  1. Code is tested
  2. New versions of API/SPA are built
  3. Deployment to production environment is triggered
  4. Post-deployment tests are run
  5. Notification is sent to the TA

### Security Considerations
- All credentials are stored securely
- Infrastructure follows least-privilege principle
- All communications use TLS/SSL
- API implements rate limiting and other security controls
- Regular security audits are scheduled

## Dependencies
- Existing Zulip server with STUF Admin tool installed
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
