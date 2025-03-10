# Epic: Upload History for Project Participants

## Overview
As a Project Participant, I need to view my upload history and the history of other participants' uploads (without download access) so that I can maintain awareness of what has been shared with the project and confirm my own successful uploads.

## User Story
**As a** Project Participant  
**I want to** view a history of uploads to the STUF  
**So that** I can track what I've shared and see what others have contributed without being able to download their files

## Acceptance Criteria

### 1. Upload History View
- Project Participant can view a chronological list of all uploads to the STUF
- List displays key information for each upload:
  - Filename
  - Upload date/time
  - Uploader name
  - File size
  - File type
  - Status (processing, completed, etc.)
- List can be sorted by any column
- List can be filtered by uploader, date range, file type, etc.
- Participant's own uploads are visually distinguished from others

### 2. Personal Upload Management
- Participant can view detailed information about their own uploads
- Participant can see the complete metadata they provided with each upload
- Participant can filter to view only their own uploads
- Participant receives clear confirmation when their uploads are successful

### 3. Upload Status Tracking
- System displays the current status of each upload (received, processing, completed, etc.)
- Status updates are reflected in real-time or with minimal delay
- System provides appropriate notifications for status changes
- Status history is maintained for audit purposes

### 4. Security and Privacy Controls
- Participants can only view metadata about others' uploads, not download the files
- System enforces appropriate access controls
- All history viewing actions are logged for audit purposes
- Personal information is protected according to privacy requirements

## Detailed Flow

### Viewing Upload History
1. Project Participant logs into the STUF using email magic link and mobile OTP
2. System displays the main STUF interface
3. Participant navigates to the "Upload History" section
4. System displays a chronological list of all uploads to the STUF
5. Participant can sort the list by clicking on column headers
6. Participant can filter the list using filter controls
7. Participant's own uploads are highlighted or otherwise visually distinguished

### Managing Personal Uploads
1. Participant can select "My Uploads" filter to view only their own uploads
2. Participant can select an upload to view detailed information
3. System displays complete metadata provided with the upload
4. System displays the current status of the upload
5. Participant can return to the full history view

### Upload Status Tracking
1. When a participant uploads a file, system displays initial "Processing" status
2. As the upload progresses through the system, status updates automatically
3. Final status (e.g., "Completed") is displayed when processing is finished
4. Any issues or errors are clearly indicated with appropriate status messages
5. Status changes are reflected in the history view in real-time or with minimal delay

## Technical Implementation Details

### Data Model
- Upload record with fields:
  - ID (UUID)
  - Filename
  - Original filename
  - File size
  - File type/MIME type
  - Upload date/time
  - Uploader ID (reference to user)
  - Uploader name
  - Status
  - Status history (array of status changes with timestamps)
  - Metadata (JSON object with all provided metadata)

### User Interface Components
- React-based history view with:
  - Sortable, filterable data table
  - Status indicators with appropriate colors
  - Responsive design for all device sizes
  - Accessibility features for screen readers
  - Pagination for large history lists

### Security Implementation
- Access control checks on all history API endpoints
- Separation between metadata access and file access
- Comprehensive logging of all history view actions
- Data minimization in API responses

## Dependencies
- Authentication system (from Mobile OTP Authentication epic)
- File upload functionality
- Metadata configuration (from Metadata Configuration epic)
- Audit logging system

## Timeline
- Upload history data model: 2-3 days
- Basic history view implementation: 3-4 days
- Filtering and sorting functionality: 2-3 days
- Personal upload management: 2-3 days
- Status tracking implementation: 2-3 days
- Testing and refinement: 3-4 days
- Total estimated time: 2-3 weeks
