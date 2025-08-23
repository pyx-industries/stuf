# STUF Epics Overview

![STUF Use Case Diagram](../img/stuf_use_case_diagram.png)

## Stakeholders and Their Needs

### Trust Architects (TA)
Trust Architects are the primary administrators of the Secure Trusted Upload Facility (STUF). They need to:

- Create and configure new STUF instances for projects ([Create New STUF](create_new_STUF.md))
- Access and download submitted files ([Admin Tool Download Interface](admin_tool_download_interface.md))
- Maintain security and compliance of the system

### Project Participants
Project Participants are users who need to share confidential information with the project. They need to:

- Upload files with appropriate metadata ([File Upload Interface](file_upload_interface.md))
- View their upload history and status ([Upload History](upload_history.md))
- See what others have contributed (without downloading)

## Epic Summary

The epics define a comprehensive system for secure file uploads with the following key components:

1. [**Create New STUF**](create_new_STUF.md) - Allows Trust Architects to set up new secure upload facilities for projects
2. [**File Upload Interface**](file_upload_interface.md) - Provides an intuitive interface for Project Participants to upload files
3. [**Admin Tool Download Interface**](admin_tool_download_interface.md) - Enables Trust Architects to securely access uploaded files
4. [**Upload History**](upload_history.md) - Provides visibility into what has been uploaded to the system

Additional features and enhancements are documented in the future_sprints directory, containing ideas that are out of scope for the current work but may be implemented in future iterations.

Together, these epics form a secure, auditable system for sharing confidential information while maintaining appropriate governance and compliance controls.
