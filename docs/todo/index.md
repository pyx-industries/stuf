# Secure Trusted Upload Facility (STUF) - System Specification

## Overview
The Secure Trusted Upload Facility (STUF) is a secure, isolated system that allows authorized participants to upload proprietary and confidential documents. All uploaded content is stored in a project-specific AWS bucket or Azure storage account. The system includes authentication mechanisms to ensure only authorized users can upload files and an admin interface for managing the system.

## Core Components

### 1. Storage Backend
- Project-specific AWS S3 bucket or Azure Storage account
- Secure configuration with appropriate access controls
- Encryption for data at rest and in transit

### 2. Authentication System
- Two-factor authentication process:
  1. Email verification via "magic link"
  2. SMS-based OTP (One-Time Password) verification
- Authorized users list maintained in a configuration spreadsheet

### 3. Admin Interface
- Access to view and manage uploaded content
- Configuration management for:
  - Authorized users (email + phone number pairs)
  - Storage settings
  - Notification settings

### 4. Notification System
- Integration with Zulip for event notifications
- All upload events reported to a dedicated "secure trusted upload event" topic

## User Flow

### First-time Authentication
1. User visits the SUF website
2. User enters their email address
3. System verifies email against authorized users list
4. If authorized, system sends a "magic link" to the user's email
5. User clicks the magic link to verify email ownership
6. System sends an OTP code via SMS to the user's registered phone number
7. User enters the OTP code to complete authentication
8. User gains access to the upload interface

### Subsequent Authentication
1. User visits the SUF website
2. User enters their email address
3. System verifies email against authorized users list
4. If authorized, system sends an OTP code via SMS to the user's registered phone number
5. User enters the OTP code to complete authentication
6. User gains access to the upload interface

## Technical Requirements

### Security
- TLS/SSL for all communications
- Secure storage of user credentials
- Rate limiting for authentication attempts
- Audit logging of all system activities
- Session management with appropriate timeouts

### Configuration Management
- Spreadsheet format for authorized users list (email + phone number)
- Secure storage and access of configuration data
- Backup and versioning of configuration data

### Notifications
- Zulip API integration
- Configurable endpoint and credentials
- Event-based notifications for all upload activities

## Development Priorities
1. Storage backend setup and security configuration
2. Authentication system implementation
3. Admin interface development
4. Notification system integration
5. User interface development
6. Testing and security audit

## Implementation Considerations
- Use serverless architecture where possible for better isolation
- Implement strict CORS policies
- Consider compliance requirements (GDPR, etc.)
- Implement file scanning for malware before storage
- Consider file size limits and upload quotas
