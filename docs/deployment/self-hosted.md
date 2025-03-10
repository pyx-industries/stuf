# Self-hosted Deployment

This document details the deployment workflows for self-hosted scenarios, where the Secure Trusted Upload Facility (STUF) is deployed on customer infrastructure.

## Deployment Scenarios

There are two primary self-hosted deployment scenarios:

1. **Pyx-hosted Zulip + Self-hosted STUF** (hybrid)
   - Zulip instance hosted by Pyx.io
   - STUF deployed on customer's infrastructure
   - Integration with Pyx-hosted Zulip for notifications

2. **Self-hosted Zulip + Self-hosted STUF** (fully self-hosted)
   - Customer-managed Zulip instance
   - STUF deployed on customer's infrastructure
   - All components run in customer's environment

## Scenario 1: Pyx-hosted Zulip + Self-hosted STUF

### Configuration

1. **Access the Admin Tool**
   - Trust Architect (TA) logs into Pyx-hosted Zulip
   - TA accesses the STUF Admin tool (Django app)
   - TA selects "Create New Self-hosted STUF" option

2. **Configure the STUF Instance**
   - TA enters project details:
     - Project name and description
     - Cloud provider information (AWS or Azure)
     - List of authorized users (email + phone pairs)
     - Zulip channel for notifications
   - TA indicates self-hosted deployment preference
   - TA submits the configuration for validation

### Package Generation

1. **Deployment Package Creation**
   - Django app validates the configuration
   - Django app triggers a GitHub workflow to generate a deployment package
   - Package includes:
     - Ansible playbooks for infrastructure provisioning
     - Docker Compose files for containerized components
     - Configuration templates with Zulip integration details
     - Documentation for deployment

2. **Package Delivery**
   - System generates a secure download link
   - TA receives notification with the download link
   - TA downloads the deployment package

### Self-deployment

1. **Infrastructure Provisioning**
   - TA prepares their cloud environment (AWS or Azure)
   - TA runs the provided Ansible playbooks against their cloud infrastructure
   - Scripts provision necessary resources:
     - API hosting environment
     - SPA hosting
     - Storage bucket
     - Networking and security configurations

2. **Application Deployment**
   - Ansible playbooks deploy STUF API and SPA to the provisioned infrastructure
   - Docker Compose files are used for containerized components
   - Configuration includes Zulip integration details

3. **Verification**
   - Scripts perform validation tests on the deployment
   - TA verifies functionality with a test upload
   - TA confirms Zulip notifications are working

### Operation

1. **Day-to-Day Usage**
   - STUF API reads configuration from the customer's storage bucket
   - STUF API sends notifications to Pyx-hosted Zulip
   - TA manages the STUF through the Django app in Zulip

2. **Monitoring and Management**
   - TA can view upload events in the configured Zulip channel
   - TA can access uploaded files through the Admin tool
   - TA can modify the authorized users list as needed
   - TA can update STUF configuration through the Admin tool

## Scenario 2: Self-hosted Zulip + Self-hosted STUF

### Zulip Installation

1. **Set Up Zulip Server**
   - TA installs Zulip on their infrastructure following Zulip documentation
   - TA configures Zulip for their organization

2. **Install STUF Django App**
   - TA installs the STUF Django app as a Zulip plugin
   - TA configures the plugin with appropriate settings

### Configuration

1. **Access the Admin Tool**
   - For Zulip-integrated deployment:
     - TA logs into their self-hosted Zulip
     - TA accesses the STUF Admin tool (Django app) within Zulip
   - For standalone deployment:
     - TA logs into the standalone STUF Admin tool
   - TA selects "Create New STUF" option

2. **Configure the STUF Instance**
   - TA enters project details:
     - Project name and description
     - Cloud provider information (AWS or Azure)
     - List of authorized users (email + phone pairs)
     - Zulip channel for notifications
   - TA submits the configuration for validation

### Deployment

1. **Infrastructure Provisioning**
   - Django app generates deployment scripts
   - TA runs scripts against their cloud infrastructure
   - Scripts provision necessary resources:
     - API hosting environment
     - SPA hosting
     - Storage bucket
     - Networking and security configurations

2. **Application Deployment**
   - Scripts deploy STUF API and SPA to the provisioned infrastructure
   - Docker Compose files are used for containerized components
   - All components run in TA's environment

3. **Verification**
   - Scripts perform validation tests on the deployment
   - TA verifies functionality with a test upload
   - TA confirms Zulip notifications are working

### Operation

1. **Day-to-Day Usage**
   - STUF API reads configuration from the customer's storage bucket
   - STUF API sends notifications to self-hosted Zulip
   - TA manages the STUF through the Django app in their Zulip instance

2. **Monitoring and Management**
   - TA can view upload events in the configured Zulip channel
   - TA can access uploaded files through the Admin tool
   - TA can modify the authorized users list as needed
   - TA can update STUF configuration through the Admin tool

## Scenario 3: Custom Deployment

For organizations that need complete customization:

1. **Code Acquisition**
   - TA forks or clones the STUF repository
   - TA reviews the codebase and documentation

2. **Customization**
   - TA modifies code and infrastructure as needed
   - TA adapts configuration to their environment

3. **Deployment**
   - TA deploys using their preferred methods
   - TA integrates with their existing systems as needed

## Technical Details

### Infrastructure Components

- **API Service**: Can be deployed as serverless functions or containers
- **SPA**: Can be hosted on any static site hosting service
- **Storage**: AWS S3 bucket or Azure Storage account
- **Database**: Any compatible database system
- **Networking**: Customer-managed networking and security

### Security Considerations

- **Authentication**: Two-factor authentication for all users
- **Authorization**: Role-based access control
- **Encryption**: TLS for all communications, encryption at rest
- **Monitoring**: Customer-managed monitoring solutions
- **Logging**: Comprehensive audit logging of all activities

### Maintenance and Updates

- **Manual Updates**: TA is responsible for applying updates
- **Feature Updates**: New features can be pulled from the main repository
- **Backup**: TA is responsible for backup strategies
- **Disaster Recovery**: TA is responsible for disaster recovery planning

## Advantages of Self-hosted Deployment

1. **Control**: Complete control over infrastructure and data
2. **Customization**: Ability to customize to specific requirements
3. **Integration**: Easier integration with existing systems
4. **Data Sovereignty**: Data remains within customer-controlled environments
5. **Security**: Can implement organization-specific security measures

## Challenges

1. **Maintenance**: Responsibility for updates and maintenance
2. **Expertise**: Requires technical expertise to deploy and manage
3. **Support**: Self-support or limited support options
4. **Updates**: Manual process for applying updates

## Next Steps

- See [Migration](migration.md) for information on migrating between deployment scenarios
- Review [Pyx-hosted](pyx-hosted.md) for details on fully managed deployment options
