# Secure Trusted Upload Facility (STUF) - Deployment Documentation

## Overview

The Secure Trusted Upload Facility (STUF) is designed to support multiple deployment scenarios to accommodate different organizational needs and security requirements. This documentation outlines the architectural approach for organizing and deploying the STUF codebase across various hosting configurations.

## Deployment Scenarios

The STUF architecture supports four primary deployment scenarios:

1. **Pyx-hosted Zulip + Pyx-hosted STUF** (fully managed)
   - Zulip instance hosted by Pyx.io
   - STUF deployed on Pyx-managed infrastructure
   - Storage buckets provisioned in Pyx cloud accounts

2. **Pyx-hosted Zulip + Self-hosted STUF** (hybrid)
   - Zulip instance hosted by Pyx.io
   - STUF deployed on customer's infrastructure
   - Storage buckets in customer's cloud accounts
   - Integration with Pyx-hosted Zulip for notifications

3. **Self-hosted Zulip + Self-hosted STUF** (fully self-hosted)
   - Customer-managed Zulip instance
   - STUF deployed on customer's infrastructure
   - All components run in customer's environment

4. **Custom Deployment** (DIY approach)
   - Customer uses STUF source code as a starting point
   - Custom infrastructure and deployment methods
   - Potentially modified codebase to suit specific needs

## Repository Structure

The STUF codebase is organized to support all deployment scenarios while maintaining a single source of truth:

```
stuf/
├── api/                      # STUF API service
├── spa/                      # STUF Single Page Application
├── django_app/               # Zulip pluggable Django app
├── infrastructure/
│   ├── ansible/              # Ansible playbooks for all deployment scenarios
│   │   ├── pyx-hosted/       # Playbooks for Pyx-hosted infrastructure
│   │   ├── self-hosted/      # Playbooks for self-hosted infrastructure
│   │   └── migration/        # Playbooks for migrating between scenarios
│   ├── docker-compose/       # Docker Compose files for local/self-hosted
│   └── templates/            # Configuration templates for different scenarios
├── .github/
│   └── workflows/            # GitHub Actions workflows
│       ├── ci.yml            # Testing and validation
│       ├── pyx-deploy.yml    # Deployment to Pyx infrastructure
│       ├── self-deploy.yml   # Generate self-hosted deployment artifacts
│       └── release.yml       # Release management
└── docs/
    ├── deployment/
    │   ├── index.md          # This file - deployment overview
    │   ├── pyx-hosted.md     # Documentation for Pyx-hosted scenario
    │   ├── self-hosted.md    # Documentation for self-hosted scenario
    │   └── migration.md      # Documentation for migration between scenarios
```

## Technical Implementation Details

### Configuration Management

Configuration is managed through a layered approach:

1. **Base Configuration**
   - Default settings applicable to all deployments
   - Stored in version-controlled configuration files

2. **Environment Configuration**
   - Settings specific to deployment scenario (Pyx vs. self-hosted)
   - Generated during deployment process

3. **Instance Configuration**
   - Project-specific settings (authorized users, storage details, etc.)
   - Stored in database and/or storage bucket

Sensitive information is stored using:
- Environment variables for runtime secrets
- Secure storage services (AWS Secrets Manager, Azure Key Vault, etc.)
- Encrypted configuration files for self-hosted scenarios

### Automation Technologies

The SUF deployment leverages three primary automation technologies:

1. **GitHub Workflows**
   - Continuous integration and testing
   - Automated deployment to Pyx infrastructure
   - Generation of self-hosted deployment packages
   - Release management and versioning

2. **Ansible**
   - Infrastructure provisioning across cloud providers
   - Configuration management for all components
   - Consistent deployment across environments
   - Migration support between scenarios

3. **Docker Compose**
   - Local development environment
   - Containerized deployment for self-hosted scenarios
   - Simplified updates and rollbacks
   - Consistent runtime environment

### Security Considerations

Each deployment scenario implements appropriate security measures:

1. **Pyx-hosted**
   - Managed security by Pyx.io
   - Regular security audits and updates
   - Compliance with industry standards

2. **Self-hosted**
   - Security hardening scripts included in deployment package
   - Documentation for security best practices
   - Configuration validation to prevent common misconfigurations

3. **All Scenarios**
   - TLS/SSL for all communications
   - Least-privilege access controls
   - Audit logging and monitoring
   - Regular security updates

## Code Under Glass: Transparency by Design

The STUF deployment follows a "code under glass" strategy that embodies our commitment to transparency and customer trust:

1. **Complete Visibility**
   - All configuration, infrastructure as code, and source code is preserved in a private git repository
   - Trust Architects have read access to this repository at all times
   - The repository represents the exact "as-deployed" state and complete history of deployments

2. **Earned Trust**
   - This transparency allows customers to verify:
     - Security patches are being applied promptly
     - Configuration is maintained according to best practices
     - Incident response happens in real-time
     - All changes are documented and traceable

3. **Freedom to Exit**
   - Customers are never locked in to Pyx-hosted infrastructure
   - All infrastructure as code is accessible and designed for portability
   - Migration paths are documented and tested
   - Customers can take over their infrastructure at any time

This "code under glass" approach follows the principle that "if you love something, set it free." We earn your trust by showing our work and making it possible for you to operate independently if you choose. Our goal is to deserve your continued partnership through transparency and excellence rather than through technical lock-in.

## Development Workflow

The development workflow supports all deployment scenarios:

1. **Feature Development**
   - Features developed with compatibility across all scenarios
   - Testing includes verification in each deployment model
   - Feature flags used for scenario-specific functionality

2. **Release Process**
   - Version tagging in GitHub
   - Generation of deployment artifacts for all scenarios
   - Comprehensive release notes documenting scenario-specific changes

3. **Updates and Patches**
   - Automated update process for Pyx-hosted instances
   - Update packages for self-hosted deployments
   - Clear documentation of update procedures

## Contents

- [Pyx-hosted Deployment](pyx-hosted.md)
- [Self-hosted Deployment](self-hosted.md)
- [Migration Between Deployment Scenarios](migration.md)
