# Project Participant Journey: Uploading Files to STUF

## User
Project Participant

## Goal
Securely upload confidential files to the project with appropriate metadata

## Journey Steps

### 1. Authentication
- Participant receives email with magic link to STUF
- Participant clicks the magic link to access STUF
- Participant enters their phone number for OTP verification
- Participant receives and enters the OTP
- System authenticates the participant

### 2. File Selection
- Participant navigates to the upload interface
- Participant selects file(s) to upload via drag-and-drop or file browser
- System validates the selected file(s) against configured restrictions
- Participant confirms the file selection

### 3. Metadata Entry
- System presents metadata form based on TA configuration
- Participant completes required metadata fields
- Participant adds optional metadata as appropriate
- System validates the metadata entries in real-time

### 4. Upload Process
- Participant initiates the upload
- System displays upload progress
- System processes the file (scanning, validation)
- System confirms successful upload
- Participant receives confirmation details and reference ID

### 5. History Review
- Participant navigates to upload history
- Participant views their previous uploads
- Participant can see uploads from other participants (metadata only)
- Participant can filter and search the history

## Related User Stories
- PP_AUTH_001: Authenticate to STUF
- PP_UPLOAD_001: Select and upload files
- PP_METADATA_001: Provide file metadata
- PP_HISTORY_001: View upload history
- PP_NOTIFICATION_001: Receive upload confirmations

## Success Criteria
- Participant successfully authenticates to the system
- Files are uploaded securely with all required metadata
- Participant receives confirmation of successful upload
- Participant can view their upload history
- Uploads appear in the system for the Trust Architect to access
