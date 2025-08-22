# STUF Epics Overview

![STUF Use Case Diagram](../img/stuf_use_case_diagram.png)

## Stakeholders and Their Needs

### Trust Architects (TA)
Trust Architects are the primary administrators of the Secure Trusted Upload Facility (STUF). They need to:
- Create and configure new STUF instances for projects ([Create New STUF](create_new_STUF.md))
- Manage project participants and their access ([Manage Project Participants](manage_project_participants.md))
- Configure metadata requirements for uploads ([Metadata Configuration](metadata_configuration.md))
- Receive notifications about new uploads ([Zulip Notifications](zulip_notifications.md))
- Access and download submitted files ([Admin Tool Download Interface](admin_tool_download_interface.md))
- Maintain security and compliance of the system

### Project Participants
Project Participants are users who need to share confidential information with the project. They need to:
- Securely authenticate to the system ([Mobile OTP Authentication](mobile_otp_authentication.md))
- Upload files with appropriate metadata ([File Upload Interface](file_upload_interface.md))
- View their upload history and status ([Upload History](upload_history.md))
- See what others have contributed (without downloading)

## Epic Summary

The epics define a comprehensive system for secure file uploads with the following key components:

1. [**Create New STUF**](create_new_STUF.md) - Allows Trust Architects to set up new secure upload facilities for projects
2. [**Mobile OTP Authentication**](mobile_otp_authentication.md) - Implements secure authentication using email magic links and mobile one-time passwords
3. [**Metadata Configuration**](metadata_configuration.md) - Enables Trust Architects to define required metadata for uploads
4. [**File Upload Interface**](file_upload_interface.md) - Provides an intuitive interface for Project Participants to upload files
5. [**Manage Project Participants**](manage_project_participants.md) - Allows Trust Architects to control who can access the system
6. [**Admin Tool Download Interface**](admin_tool_download_interface.md) - Enables Trust Architects to securely access uploaded files
7. [**Upload History**](upload_history.md) - Provides visibility into what has been uploaded to the system
8. [**Zulip Notifications**](zulip_notifications.md) - Sends real-time notifications to Trust Architects when files are uploaded

Together, these epics form a secure, auditable system for sharing confidential information while maintaining appropriate governance and compliance controls.
