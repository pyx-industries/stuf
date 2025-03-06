# Migration Between Deployment Scenarios

This document details the process for migrating between different deployment scenarios of the Secure Trusted Upload Facility (STUF), with a particular focus on migrating from Pyx-hosted to self-hosted environments.

## Migration Pathways

The STUF architecture supports several migration pathways:

1. **Pyx-hosted to Self-hosted** (most common)
   - From fully managed to customer infrastructure
   - Maintains integration with Pyx-hosted Zulip

2. **Pyx-hosted to Fully Self-hosted**
   - Complete migration to customer infrastructure
   - Includes migration to self-hosted Zulip

3. **Self-hosted to Pyx-hosted** (less common)
   - Migration from customer infrastructure to Pyx-managed
   - For customers seeking to reduce infrastructure management

## Pyx-hosted to Self-hosted Migration

### Preparation Phase

1. **Request Migration Package**
   - TA logs into Pyx-hosted Zulip
   - TA accesses the STUF Admin tool
   - TA selects "Migrate to Self-hosted" option
   - TA confirms cloud provider details (AWS or Azure)

2. **System Preparation**
   - System generates migration scripts and configuration export
   - System creates a migration plan document
   - System prepares a deployment package for self-hosted infrastructure

3. **Package Delivery**
   - System generates a secure download link
   - TA receives notification with the download link
   - TA downloads the migration package

### Data Export Phase

1. **Configuration Export**
   - Migration scripts export configuration from Pyx-hosted environment
   - Exported configuration includes:
     - Authorized users list
     - Storage settings
     - Notification settings
     - Custom branding elements

2. **Content Migration Planning**
   - Scripts analyze existing uploaded content
   - Scripts generate a migration plan for content
   - TA reviews and approves the migration plan

3. **Content Export**
   - Tools migrate uploaded files between storage buckets
   - Migration can be performed in batches for large volumes
   - System validates file integrity during migration

### Self-hosted Deployment Phase

1. **Infrastructure Provisioning**
   - TA prepares their cloud environment (AWS or Azure)
   - TA runs the provided Ansible playbooks against their cloud infrastructure
   - Scripts provision necessary resources:
     - API hosting environment
     - SPA hosting
     - Storage bucket
     - Networking and security configurations

2. **Application Deployment**
   - Ansible playbooks deploy SUF API and SPA to the provisioned infrastructure
   - Docker Compose files are used for containerized components
   - Configuration includes Zulip integration details

3. **Configuration Import**
   - Migration scripts import the exported configuration
   - Scripts transform settings as needed for self-hosted environment
   - System validates the imported configuration

### Verification Phase

1. **System Validation**
   - System performs automated tests on the self-hosted environment
   - Tests verify API functionality, SPA operation, and Zulip integration
   - System generates a validation report

2. **User Validation**
   - TA performs test uploads in the self-hosted environment
   - TA verifies Zulip notifications are working
   - TA confirms access to migrated content

3. **Cutover Planning**
   - TA decides on cutover strategy (immediate or phased)
   - System prepares cutover plan based on TA's decision
   - TA communicates plan to users

### Cutover Phase

1. **Immediate Cutover**
   - Pyx-hosted SUF is set to read-only mode
   - Final content migration is performed
   - DNS/URL redirects are updated to point to self-hosted environment
   - Users are notified of the new environment

2. **Phased Cutover**
   - Both environments operate in parallel
   - New uploads directed to self-hosted environment
   - Gradual transition of users to new environment
   - Pyx-hosted environment decommissioned after transition period

3. **Post-Cutover**
   - TA verifies all functionality in self-hosted environment
   - Pyx-hosted environment is decommissioned
   - TA receives documentation for managing self-hosted environment

## Pyx-hosted to Fully Self-hosted Migration

This migration follows the same process as above, with additional steps:

1. **Zulip Installation**
   - TA installs Zulip on their infrastructure
   - TA configures Zulip for their organization
   - TA installs the STUF Django app as a Zulip plugin

2. **Zulip Data Migration**
   - Scripts export STUF-related data from Pyx-hosted Zulip
   - Data is imported into self-hosted Zulip
   - System validates the imported data

3. **Integration Configuration**
   - Self-hosted STUF is configured to integrate with self-hosted Zulip
   - Integration is tested and validated

## Self-hosted to Pyx-hosted Migration

This less common migration path involves:

1. **Configuration Export**
   - TA exports configuration from self-hosted environment
   - TA provides configuration to Pyx.io support

2. **Pyx-hosted Setup**
   - Pyx.io support sets up new SUF instance
   - Configuration is imported into Pyx-hosted environment

3. **Content Migration**
   - Tools migrate content from self-hosted to Pyx-hosted storage
   - System validates migrated content

4. **Cutover**
   - Self-hosted environment is set to read-only
   - DNS/URL redirects are updated
   - Users are notified of the new environment

## Technical Considerations

### Data Integrity

- Checksums are used to verify file integrity during migration
- Database transactions ensure configuration consistency
- Rollback procedures are available in case of migration issues

### Security

- All data transfers use secure protocols (TLS/SFTP)
- Credentials are not included in migration packages
- Access controls are maintained during migration
- Audit logging tracks all migration activities

### Performance

- Large file migrations are performed in batches
- Migration can be scheduled during off-peak hours
- Progress monitoring is available for long-running migrations

### Downtime Management

- Migration strategies aim to minimize downtime
- Read-only mode allows access to existing files during migration
- Clear communication plan for users during transition

## Post-Migration Support

After migration is complete:

1. **Documentation**
   - TA receives comprehensive documentation for the new environment
   - Documentation includes management procedures and troubleshooting

2. **Training**
   - Optional training sessions for self-hosted environment management
   - Knowledge transfer for infrastructure and application management

3. **Support Options**
   - Ongoing support options for self-hosted environments
   - Escalation procedures for critical issues

## Conclusion

The STUF architecture is designed to support flexible migration between deployment scenarios, allowing organizations to choose the deployment model that best suits their needs while providing clear pathways to change that model as requirements evolve.
