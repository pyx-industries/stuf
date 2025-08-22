# Epic: Zulip Notifications for STUF

## Overview
As a Trust Architect (TA), I need to receive real-time notifications in Zulip when files are uploaded to the Secure Trusted Upload Facility (STUF), so that I can be promptly informed of new submissions without constantly checking the STUF system.

## User Story
**As a** Trust Architect  
**I want to** receive notifications in Zulip when files are uploaded to the STUF  
**So that** I can be promptly informed of new submissions and take appropriate action

## Acceptance Criteria

### 1. Notification Configuration
- TA can configure Zulip notification settings during STUF setup:
  - Zulip stream name for notifications
  - Topic name for notifications
  - Notification format preferences
- TA can update notification settings after initial setup
- System validates Zulip stream and topic existence during configuration

### 2. Upload Notifications
- System automatically sends a notification to the configured Zulip stream/topic when a file is uploaded
- Notification includes key information:
  - Filename
  - Upload date/time
  - Uploader name and email
  - File size
  - File type
  - Link to access the file in the STUF Admin tool
- Notifications are formatted for readability in Zulip
- System handles notification failures gracefully

### 3. Batch Notifications
- System can batch notifications for multiple uploads within a short time period
- Batched notifications include summary information and details for each upload
- TA can configure batch notification thresholds and timing
- System provides option to disable batching if immediate notifications are preferred

### 4. Notification Security
- Notifications include only appropriate metadata, not file contents
- Links in notifications require proper authentication to access
- System logs all notification attempts for audit purposes
- Notification content follows data minimization principles

## Detailed Flow

### Configuring Notifications
1. TA logs into the STUF Admin tool
2. TA navigates to the "Notification Settings" section
3. TA enters or updates Zulip notification settings:
   - Zulip stream name
   - Topic name
   - Notification format preferences
   - Batching preferences
4. System validates the Zulip stream and topic existence
5. System saves the notification configuration
6. System sends a test notification to verify configuration

### Upload Notification Process
1. Project Participant uploads a file to the STUF
2. System processes and stores the file
3. System retrieves the notification configuration
4. System checks if batching is enabled and appropriate
5. If batching is not applicable, system immediately prepares a notification
6. System formats the notification according to configured preferences
7. System sends the notification to the configured Zulip stream/topic
8. System logs the notification event
9. System handles any notification failures with appropriate retry logic

### Batch Notification Process
1. Multiple files are uploaded to the STUF within the configured batching threshold
2. System collects metadata for all uploads in the batch
3. At the end of the batching period, system prepares a summary notification
4. Notification includes summary statistics and details for each upload
5. System formats the batch notification according to configured preferences
6. System sends the notification to the configured Zulip stream/topic
7. System logs the batch notification event
8. System handles any notification failures with appropriate retry logic

## Technical Implementation Details

### Zulip Integration
- Integration with Zulip API for sending messages
- Authentication using Zulip API key
- Stream and topic validation using Zulip API
- Proper error handling for API failures

### Notification Formatting
- Markdown formatting for readability in Zulip
- Structured message format with clear sections
- Appropriate use of emoji or other visual indicators
- Links formatted for easy access to the STUF Admin tool

### Batching Implementation
- Time-based batching with configurable threshold
- Count-based batching with configurable threshold
- Hybrid approach based on TA preferences
- Immediate override for high-priority uploads

### Security Considerations
- Secure storage of Zulip API credentials
- Data minimization in notification content
- Authentication requirements for included links
- Comprehensive logging for audit purposes

## Dependencies
- STUF Admin tool
- Zulip API access
- File upload functionality
- Authentication system

## Timeline
- Notification configuration interface: 2-3 days
- Basic Zulip integration: 2-3 days
- Upload notification implementation: 2-3 days
- Batch notification functionality: 2-3 days
- Testing and refinement: 2-3 days
- Total estimated time: 1-2 weeks
