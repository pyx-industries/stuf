# Trust Architect Guide

## Creating a New STUF

1. **Access the STUF Admin Tool**
   - Option 1: Standalone Admin Tool (MVP)
     - Navigate to the STUF Admin Tool URL in your browser
     - Log in with your administrator credentials
   - Option 2: Zulip Integration (future enhancement)
     - Log in to your Zulip account
     - Navigate to the STUF Admin tool in the left sidebar
   - Click "New STUF (upload facility)"

2. **Configure Basic Settings**
   - Enter a project name and description
   - Select a private stream you have access to for the STUF
   - Enter a name for the STUF (will be used as the topic for upload announcements)
   - Configure metadata requirements for uploads:
     - **Enable or disable** each type of metadata collection based on your project needs
     - For each enabled metadata type, configure:
       - File types (create a list of allowed types, optionally include "Don't know" or "Other (specify)")
       - Collections (create a list of collections, optionally include "Don't know" or "Other (specify)")
       - IP ownership options:
         - Create a predefined list of ownership options (e.g., "My organization", "Third party", "Open source")
         - Choose between predefined list only, free text entry, or combination
         - Decide whether to allow "Don't know" option or require definitive selection
         - Set whether ownership declaration is legally binding
         - **Or choose not to collect IP ownership information at all**
       - License conditions:
         - Create a list of license options (e.g., specific open source licenses, proprietary licenses)
         - Choose between predefined list only, free text entry, or combination
         - Decide whether to allow "Don't know" option or require definitive selection
         - Configure whether additional documentation is required for certain license types
         - **Or choose not to collect license information at all**
       - Comment fields (can be made required for specific file types, collections, ownership types, or license conditions)
     - For each enabled metadata type, mark as required or optional
     - Configure help text for each enabled field to guide users
     - **Note: You can choose to collect minimal metadata or extensive metadata based on your governance requirements**

5. **Review and Create**
   - Review all settings
   - Click "Create STUF"
   - System will begin provisioning infrastructure
   - You'll receive a notification in your selected Zulip stream when deployment is complete
   - The notification will include links to:
     - Verify the configuration
     - Customize branding
     - Configure authorized users

4. **Configure Basic Branding**
   - Upload organization logo
   - Add custom welcome message

   > Note: Additional custom branding elements are planned for future releases.

3. **Configure Authorized Users**
   - Add users individually (email + phone pairs)
   - Or upload a CSV file with user information
   - Optionally set expiration dates for access
   - Send verification emails with magic links to users when they need to access the system
   - Users must click these verification links before they can authenticate with SMS OTP

## Managing an Existing STUF

1. **View STUF Dashboard**
   - For standalone deployment (MVP):
     - Log in to the STUF Admin tool
   - For Zulip-integrated deployment (future enhancement):
     - Log in to Zulip
     - Navigate to STUF Admin tool
   - Select the STUF from the list

2. **Monitor Activity**
   - View recent uploads
   - Check system health
   - Review basic logs

   > Note: Advanced audit logging features are planned for future releases.

3. **Manage Users**
   - Add or remove authorized users
   - Reset user access
   - View user activity
   - See when verification emails were last sent to each user
   - Resend verification emails with magic links to users as needed
   - Monitor which users have completed email verification

4. **Access Files**
   - Browse uploaded files
   - Download files
   - Manage file retention

   > Note: Multi-cloud storage options and upload receipts are planned for future releases.

5. **Update Configuration**
   - Modify notification settings
   - Update basic configuration
   - Adjust basic branding elements

## Troubleshooting

1. **User Access Issues**
   - Verify user email and phone in authorized users list
   - Check if user has clicked the verification magic link
   - Check notification logs for delivery issues
   - Resend verification email if needed
   - Reset user access if necessary

2. **Upload Failures**
   - Check storage connectivity
   - Verify bucket permissions
   - Review API logs for errors

3. **Notification Issues**
   - Verify Zulip stream exists
   - Check API permissions for Zulip
   - Test notification delivery manually
