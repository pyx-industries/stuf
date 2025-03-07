# Trust Architect Guide

## Creating a New STUF

1. **Access the STUF Admin Tool**
   - Log in to your Zulip account
   - Navigate to the STUF Admin tool in the left sidebar
   - Click "New STUF (upload facility)"

2. **Configure Basic Settings**
   - Enter a project name and description
   - Select a private stream you have access to for the STUF
   - Enter a name for the STUF (will be used as the topic for upload announcements)

3. **Configure Authorized Users**
   - Add users individually (email + phone pairs)
   - Or upload a CSV file with user information
   - Optionally set expiration dates for access

4. **Configure Branding (Optional)**
   - Upload organization logo
   - Set custom colors and text
   - Add custom welcome message

5. **Review and Create**
   - Review all settings
   - Click "Create STUF"
   - System will provision infrastructure and deploy

## Managing an Existing STUF

1. **View STUF Dashboard**
   - Log in to Zulip
   - Navigate to STUF Admin tool
   - Select the STUF from the list

2. **Monitor Activity**
   - View recent uploads
   - Check system health
   - Review audit logs

3. **Manage Users**
   - Add or remove authorized users
   - Reset user access
   - View user activity

4. **Access Files**
   - Browse uploaded files
   - Download files
   - Manage file retention

5. **Update Configuration**
   - Modify notification settings
   - Update storage configuration
   - Change branding elements

## Troubleshooting

1. **User Access Issues**
   - Verify user email and phone in authorized users list
   - Check notification logs for delivery issues
   - Reset user access if necessary

2. **Upload Failures**
   - Check storage connectivity
   - Verify bucket permissions
   - Review API logs for errors

3. **Notification Issues**
   - Verify Zulip stream exists
   - Check API permissions for Zulip
   - Test notification delivery manually
