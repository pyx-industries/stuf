# Pyx-hosted Deployment

This document details the deployment workflow for the Pyx-hosted scenario, where both Zulip and the Secure Trusted Upload Facility (STUF) are hosted on Pyx.io infrastructure.

## Deployment Workflow

### Configuration

1. **Access the Admin Tool**
   - For Zulip-integrated deployment:
     - Trust Architect (TA) logs into Pyx-hosted Zulip
     - TA accesses the STUF Admin tool (Django app) within Zulip
   - For standalone deployment (MVP):
     - TA logs into the standalone STUF Admin tool
   - TA selects "Create New STUF" option

2. **Configure the STUF Instance**
   - TA enters project details:
     - Project name and description
     - Storage preferences (AWS S3 or Azure Storage)
     - List of authorized users (email + phone pairs)
     - Zulip channel for notifications
     - Optional branding elements
   - TA submits the configuration for validation

### Provisioning

1. **Infrastructure Creation**
   - Django app validates the configuration
   - Django app triggers a GitHub workflow via API
   - Workflow runs Ansible playbooks to provision infrastructure on Pyx cloud accounts
   - Resources created include:
     - API hosting environment (Lambda/Functions/Container)
     - SPA hosting (CDN/Static site)
     - Storage bucket with appropriate permissions
     - Networking and security configurations

2. **Code Deployment**
   - GitHub workflow creates a new repository for the STUF instance
   - Workflow pushes STUF API and SPA code to the repository
   - Workflow configures CI/CD pipelines for the repository

### Deployment

1. **Application Deployment**
   - GitHub workflow deploys STUF API and SPA to the provisioned infrastructure
   - Configuration is stored in the Pyx-managed database and storage bucket
   - System performs validation tests on the deployment

2. **Verification**
   - System runs automated tests to verify functionality
   - TA receives notification that the STUF is ready for use
   - TA can perform a test upload to verify end-to-end functionality

### Operation

1. **Day-to-Day Usage**
   - STUF API reads configuration from the storage bucket
   - STUF API sends notifications to Pyx-hosted Zulip
   - TA manages the STUF through the Django app in Zulip

2. **Monitoring and Management**
   - TA can view upload events in the configured Zulip channel
   - TA can access uploaded files through the Admin tool
   - TA can modify the authorized users list as needed
   - TA can update STUF configuration through the Admin tool
   - Repository changes, deployments, and system errors are automatically posted to Zulip
   - Sentry monitors application errors and posts aggregated issues to Zulip

3. **Incident Management**
   - Incidents are managed through dedicated Zulip streams
   - Incident team communicates and coordinates response in Zulip
   - System status updates are automatically posted during incidents
   - Post-incident analysis and reports are shared in Zulip

## Technical Details

### Infrastructure Components

- **API Service**: Deployed as AWS Lambda or Azure Functions
- **SPA**: Hosted on AWS CloudFront/S3 or Azure Static Web Apps
- **Storage**: AWS S3 bucket or Azure Storage account
- **Database**: RDS or Azure SQL for configuration storage
- **Networking**: API Gateway, VPC/VNET, Security Groups

### Security Features

- **Authentication**: Two-factor authentication for all users
- **Authorization**: Role-based access control
- **Encryption**: TLS for all communications, encryption at rest
- **Monitoring**: CloudWatch/Azure Monitor for system health
- **Logging**: Comprehensive audit logging of all activities
- **Error Tracking**: Sentry integration for application error monitoring

### Maintenance and Updates

- **Automated Updates**: System automatically applies security patches
- **Feature Updates**: New features deployed through CI/CD pipeline
- **Backup**: Automated backup of configuration and data
- **Disaster Recovery**: Failover capabilities for high availability

## Code Under Glass

In the Pyx-hosted deployment model, we implement our "code under glass" strategy to provide complete transparency:

### Repository Access

- Upon STUF creation, a dedicated private git repository is provisioned
- This repository contains:
  - All infrastructure as code (Ansible, Terraform, etc.)
  - Complete configuration files (with sensitive values securely stored)
  - Application source code as deployed
  - CI/CD pipeline definitions
  - Deployment history and changelog

### Technical Implementation

- **Repository Creation**:
  - GitHub Actions workflow automatically creates a new private repository when a STUF is provisioned
  - Repository is initialized with a standardized structure mirroring the main STUF codebase
  - Initial commit includes the exact version of code being deployed

- **Synchronization Mechanism**:
  - Every deployment operation triggers a corresponding git commit
  - A post-deployment hook captures the exact state of all deployed resources
  - Infrastructure state files (Terraform state, Ansible inventory) are committed after successful deployment
  - Configuration changes made through the Admin tool generate commits with detailed messages

- **Access Control**:
  - TAs are granted read-only access via GitHub repository permissions
  - Access is managed through SSO integration with the Pyx identity system
  - Optional: TAs can request commit-signing verification for additional trust

- **Repository Structure**:
  ```
  stuf-instance-name/
  ├── infrastructure/
  │   ├── terraform/           # Terraform state and configuration
  │   ├── ansible/             # Ansible playbooks and inventory
  │   └── deployment-logs/     # Detailed logs from each deployment
  ├── configuration/
  │   ├── api-config/          # API configuration (redacted secrets)
  │   ├── spa-config/          # SPA configuration
  │   └── integration-config/  # Zulip integration settings
  ├── application/
  │   ├── api/                 # API source code as deployed
  │   └── spa/                 # SPA source code as deployed
  ├── ci-cd/
  │   ├── pipelines/           # CI/CD pipeline definitions
  │   └── workflows/           # GitHub Actions workflow configurations
  └── audit/
      ├── deployment-history/  # Record of all deployments
      ├── config-changes/      # History of configuration changes
      └── access-logs/         # Repository access logs
  ```

- **Update Process**:
  - All changes follow a documented workflow:
    1. Change is proposed (security patch, feature update, configuration change)
    2. Change is tested in staging environment
    3. Change is deployed to production
    4. Post-deployment hook captures new state and commits to repository
    5. Commit message includes ticket reference, change description, and validation results
  - Automated diff generation highlights exactly what changed between versions

### Transparency Benefits

- **Audit Capability**: TAs can review exactly what code is running in their environment
- **Security Verification**: Security patches and updates are visible in commit history
- **Configuration Clarity**: All configuration changes are tracked and documented
- **Deployment Visibility**: Every deployment is recorded with before/after states

### Practical Applications

- **Compliance Support**: Repository history supports compliance and audit requirements
- **Knowledge Transfer**: New team members can review the complete system history
- **Migration Preparation**: If migration is desired, all necessary code is already available

The repository serves as a single source of truth for the deployed system, ensuring that TAs always have visibility into what is running in their environment and how it has evolved over time.

### Incident Response and Monitoring

The Pyx-hosted deployment leverages Zulip as the central communication hub for incident management and system monitoring:

#### Zulip Integration

1. **Repository Change Notifications**
   - All changes to the STUF repository are automatically posted to a dedicated Zulip stream
   - Notifications include commit messages, author, and links to view the changes
   - Code reviews and approvals are tracked and visible in the stream

2. **Deployment Notifications**
   - Every deployment triggers automated messages to the Zulip stream
   - Messages include deployment status (started, completed, failed)
   - Deployment summaries list affected components and configuration changes
   - Links to deployment logs and artifacts are provided

3. **Incident Communication**
   - Dedicated Zulip streams are created for active incidents
   - Incident team members collaborate in real-time within Zulip
   - Automated system status updates are posted to the incident stream
   - Post-incident reports are generated and shared in Zulip

#### Sentry Integration

The STUF deployment includes Sentry integration for comprehensive error tracking and monitoring:

1. **Error Tracking**
   - Each STUF instance reports errors to a dedicated Sentry project
   - Errors are automatically grouped into issues based on similarity
   - Stack traces and context information are captured for debugging

2. **Zulip Notifications**
   - New Sentry issues trigger notifications in the monitoring Zulip stream
   - Issue frequency and impact metrics are included in notifications
   - Direct links to Sentry dashboards are provided for investigation

3. **Support Workflow**
   - Support team monitors Sentry issues via Zulip notifications
   - Issues are automatically prioritized based on frequency and impact
   - Support team can assign, comment on, and resolve issues directly from Zulip
   - Resolution status is synchronized between Sentry and Zulip

4. **Proactive Monitoring**
   - Performance metrics and trends are analyzed by Sentry
   - Anomaly detection identifies potential issues before they impact users
   - Weekly summary reports are posted to Zulip for review

This integrated monitoring and incident response system ensures that all stakeholders have visibility into system health and that issues are addressed promptly with full transparency.

## Advantages of Pyx-hosted Deployment

1. **Fully Managed**: No infrastructure management required by the TA
2. **Simplified Setup**: Streamlined configuration process
3. **Integrated Security**: Comprehensive security managed by Pyx.io
4. **Automatic Updates**: System stays current with latest features and security patches
5. **Technical Support**: Direct support from Pyx.io team

## Limitations

1. **Customization**: Limited ability to customize infrastructure
2. **Dependency**: Reliance on Pyx.io for hosting and management
3. **Data Location**: Data stored in Pyx-managed cloud accounts

## Next Steps

- See [Migration](migration.md) for information on migrating from Pyx-hosted to self-hosted
- Review [Self-hosted](self-hosted.md) for details on self-hosted deployment options
