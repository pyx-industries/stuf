# Future Sprint: Dedicated AWS Subaccount for STUF

## Overview
As a Trust Architect (TA), I want each STUF to be deployed in its own dedicated AWS subaccount that can be transferred to my organization's AWS account, so that I can have complete control and isolation of the infrastructure hosting sensitive data.

## User Story
**As a** Trust Architect  
**I want to** have each STUF deployed in a dedicated AWS subaccount  
**So that** I can have complete control and isolation of the infrastructure hosting sensitive data, with the option to transfer ownership of the account

## Acceptance Criteria

### 1. AWS Subaccount Provisioning
- System automatically creates a new AWS subaccount for each STUF
- Subaccount is properly configured with:
  - Appropriate IAM roles and policies
  - S3 bucket for file storage
  - Required security controls
  - Networking configuration (VPC, subnets, security groups)
  - CloudTrail and CloudWatch logging
- Subaccount is tagged with STUF identifier and project information

### 2. Isolated Infrastructure
- All STUF resources are deployed within the dedicated subaccount
- No resource sharing between different STUF instances
- Complete isolation of data and access controls
- Dedicated VPC with private subnets for enhanced security

### 3. Account Transfer Capability
- TA can initiate a process to transfer ownership of the AWS subaccount
- System guides the TA through the transfer process
- Transfer can be completed to any AWS Organization with appropriate permissions
- All resources and configurations are preserved during transfer

### 4. Security and Compliance
- Subaccount is configured with security best practices
- Compliance controls are implemented and documented
- Security monitoring is enabled
- Least privilege access principles are enforced

## Detailed Flow

### Subaccount Provisioning
1. When a new STUF is created, system initiates AWS subaccount creation
2. System configures the subaccount with required resources and permissions
3. System deploys STUF infrastructure within the subaccount
4. System configures security controls and monitoring
5. System provides access credentials to the STUF Admin tool

### Infrastructure Deployment
1. System deploys all STUF components within the dedicated VPC
2. S3 bucket is created with appropriate encryption and access policies
3. VPC endpoints are configured for secure S3 access
4. CloudTrail and CloudWatch are configured for comprehensive logging
5. IAM roles and policies are created following least privilege principles

### Account Transfer Process
1. TA initiates account transfer process from the Admin tool
2. System provides documentation and guidance for the transfer
3. TA provides AWS account ID of the destination organization
4. System prepares the subaccount for transfer
5. AWS account transfer process is initiated
6. TA completes the transfer in the AWS Organizations console
7. System verifies successful transfer and updates documentation

## Technical Implementation Details

### AWS Account Structure
- Master Pyx AWS account manages all STUF subaccounts
- Each STUF gets its own subaccount within the organization
- AWS Organizations used for centralized management
- Service Control Policies (SCPs) enforce security guardrails

### Security Implementation
- VPC with private subnets for all components
- S3 access via VPC endpoints only
- No public internet access for sensitive components
- AWS KMS for encryption key management
- CloudTrail for comprehensive audit logging

### Transfer Mechanism
- AWS Organizations account transfer feature
- Custom scripts to prepare account for transfer
- Documentation generation for handover process
- Verification procedures for successful transfer

## Dependencies
- AWS Organizations with multi-account management
- Automated AWS account provisioning capability
- IAM role and policy management system
- VPC and networking automation

## Timeline
- Architecture and design: 2 weeks
- Implementation of account provisioning: 2 weeks
- Implementation of deployment automation: 2 weeks
- Implementation of transfer capability: 1 week
- Testing and validation: 2 weeks
- Total estimated time: 8-9 weeks
