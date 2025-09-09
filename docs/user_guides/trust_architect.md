# Trust Architect Guide

## Creating a New STUF

1. **Access the STUF Admin Tool**
   - Navigate to the STUF Admin Tool URL in your browser
   - Log in with your administrator credentials
   - Click "New STUF (upload facility)"

2. **Configure Basic Settings**
   - Enter a project name and description
   - Configure identity provider settings
   - Configure metadata requirements for uploads:
     - Enable or disable metadata types based on your project needs
     - For each enabled metadata type, configure appropriate options
     - Mark metadata fields as required or optional
     - Configure help text for each enabled field to guide users
     - Choose to collect minimal or extensive metadata based on governance requirements

3. **Review and Create**
   - Review all settings
   - Click "Create STUF"
   - System will begin provisioning infrastructure
   - You'll receive a notification when deployment is complete

4. **Configure Basic Branding**
   - Upload organization logo
   - Add custom welcome message

5. **Configure Authorized Users**
   - Manage users through the identity provider
   - Set appropriate access permissions
   - Configure authentication settings

## Managing an Existing STUF

1. **View STUF Dashboard**
   - Log in to the STUF Admin tool
   - Select the STUF from the list

2. **Monitor Activity**
   - View recent uploads
   - Check system health
   - Review basic logs

3. **Manage Users**
   - Manage users through the identity provider
   - View user activity
   - Configure access permissions

4. **Access Files**
   - Browse uploaded files
   - Download files
   - Manage file retention

5. **Update Configuration**
   - Update basic configuration
   - Adjust basic branding elements

> Note: Additional features may be implemented in future releases. See the future_sprints directory for ideas that are out of scope for the current work.

## Troubleshooting

1. **User Access Issues**
   - Verify user access in the identity provider
   - Check authentication logs
   - Reset user access if necessary

2. **Upload Failures**
   - Check storage connectivity
   - Verify bucket permissions
   - Review API logs for errors

3. **System Issues**
   - Check system connectivity
   - Verify configuration settings
   - Review system logs for errors
