# STUF Users and Stakeholders

This document outlines the various people who interact with or are impacted by the Secure Trusted Upload Facility (STUF) system.

## Explicitly Mentioned Users

These roles are explicitly named and described in the system documentation:

### Trust Architect (TA)

The Trust Architect is responsible for:
- Creating and configuring STUF instances
- Managing project participants and their access
- Setting up metadata requirements for uploads
- Reviewing and processing uploaded files
- Accessing all files uploaded to the project
- Monitoring upload activities through notifications
- Managing the overall security posture of the STUF instance

### Project Participant

Project Participants are the primary users who:
- Authenticate to the system using email and OTP verification
- Upload files to appropriate folders based on their assigned roles
- Provide required metadata for uploads
- View their upload history and the history of other participants' uploads
- Receive confirmation when uploads are successful

### System Administrator

System Administrators are responsible for:
- Managing and maintaining the STUF infrastructure
- Handling deployment and updates
- Monitoring system health and performance
- Troubleshooting issues
- Implementing backup and recovery procedures
- Ensuring system reliability and security

## Implied Stakeholders

These roles are not explicitly named but are implied by the system documentation:

### Pyx.io Support Team

The Pyx.io team provides:
- Support for Pyx-hosted deployments
- Assistance with migrations between deployment models
- Management of the Pyx infrastructure
- Incident response for Pyx-hosted systems

### Security Team

Security personnel who:
- Review system security
- Respond to security incidents
- Perform security audits and testing
- Ensure compliance with security requirements

### Compliance Team

Personnel responsible for:
- Ensuring regulatory compliance
- Managing audit processes
- Maintaining compliance documentation
- Reviewing system for compliance gaps

### Zulip Integration Team

Technical staff who:
- Manage the integration between STUF and Zulip
- Handle notification configurations
- Support the Django app integration with Zulip

### Cloud Provider

The infrastructure provider that:
- Supplies the platform for STUF deployments
- Manages storage buckets and related services
- Provides identity and access management services

### Incident Response Team

Personnel who:
- Respond to system incidents
- Communicate during outages
- Perform post-incident analysis
- Implement preventive measures
