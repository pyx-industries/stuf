# Epic: Manage Project Participants for STUF

## Overview
As a Trust Architect (TA), I need to manage the list of project participants who are authorized to upload files to the Secure Trusted Upload Facility (STUF), so that I can control access and ensure only authorized individuals can submit sensitive information.

## User Story
**As a** Trust Architect  
**I want to** manage the list of project participants for a STUF  
**So that** I can control who has access to upload files and maintain security

## Acceptance Criteria

### 1. View Participants
- TA can view the complete list of authorized participants for a STUF
- List displays key information for each participant:
  - Name
  - Email address
  - Phone number
  - Active status (enabled/disabled)
  - Last login/upload date
  - Number of uploads

### 2. Add Participants
- TA can add new participants individually through a form with fields for:
  - Name (required)
  - Email address (required)
  - Phone number (optional)
- TA can bulk add participants by uploading a CSV file with columns for name, email, and phone
- System validates email addresses for proper format
- System prevents duplicate email addresses

### 3. Edit Participants
- TA can edit participant details including:
  - Name
  - Email address
  - Phone number
- System validates changes and prevents duplicate email addresses
- System logs all changes to participant information

### 4. Activate/Deactivate Participants
- TA can toggle the active status of any participant
- Deactivated participants cannot upload files to the STUF
- System logs all activation/deactivation actions

### 5. Resend Access Links
- TA can trigger the system to resend magic link emails to specific participants
- System generates new secure magic links when resend is requested
- System logs all magic link resend actions
- TA receives confirmation when emails are sent successfully

## Detailed Flow

### Viewing Participants
1. TA logs into the STUF Admin tool
2. TA selects a specific STUF instance
3. TA navigates to the "Participants" section
4. System displays the complete list of participants with filtering and sorting options
5. TA can search for specific participants by name or email

### Adding Participants
1. TA selects "Add Participant" option
2. TA enters participant details (name, email, phone)
3. TA submits the form
4. System validates the information
5. System adds the participant to the database
6. System sends a welcome email with magic link to the new participant
7. TA receives confirmation of successful addition

### Bulk Adding Participants
1. TA selects "Bulk Add Participants" option
2. TA uploads a CSV file with participant information
3. System validates the CSV format and data
4. System displays a preview of participants to be added
5. TA confirms the additions
6. System adds all valid participants to the database
7. System sends welcome emails with magic links to all new participants
8. TA receives a summary report of successful additions and any errors

### Editing Participants
1. TA selects a participant from the list
2. TA selects "Edit" option
3. TA modifies participant details
4. TA submits changes
5. System validates the changes
6. System updates the participant information
7. TA receives confirmation of successful update

### Activating/Deactivating Participants
1. TA selects a participant from the list
2. TA toggles the "Active" status
3. System prompts for confirmation
4. TA confirms the change
5. System updates the participant's status
6. System logs the action
7. TA receives confirmation of successful status change

### Resending Access Links
1. TA selects a participant from the list
2. TA selects "Resend Magic Link" option
3. System prompts for confirmation
4. TA confirms the action
5. System generates a new secure magic link
6. System sends an email with the new magic link to the participant
7. System logs the action
8. TA receives confirmation when the email is sent successfully

## Technical Implementation Details

### Data Model
- Participant entity with fields:
  - ID (UUID)
  - Name
  - Email address
  - Phone number
  - Active status (boolean)
  - Created date
  - Last modified date
  - Last login date
  - Magic link token (hashed)
  - Magic link expiration date

### Security Considerations
- Email addresses and phone numbers are encrypted at rest
- All participant management actions are logged for audit purposes
- Magic links expire after a configurable time period (default: 7 days)
- Failed login attempts are tracked and rate-limited

### Integration Points
- Email service for sending magic links
- Audit logging system
- STUF access control system

## Dependencies
- STUF Admin tool
- Email delivery service
- CSV parsing library

## Timeline
- Implementation: 1-2 weeks
- Testing: 1 week
- Total estimated time: 2-3 weeks
