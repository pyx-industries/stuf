# Secure Trusted Upload Facility (STUF) - User Guides

## Trust Architect Guide

### Creating a New STUF

1. **Access the STUF Admin Tool**
   - Log in to your Zulip account
   - Navigate to the STUF Admin tool in the left sidebar
   - Click "Create New STUF"

2. **Configure Basic Settings**
   - Enter a project name and description
   - Select storage provider (AWS S3 or Azure Storage)
   - Enter or upload storage credentials
   - Select Zulip stream for notifications

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

### Managing an Existing STUF

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

### Troubleshooting

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

## End-User Guide

### Uploading Files

1. **Access the Upload Portal**
   - Use the URL provided by your Trust Architect
   - The portal will display your organization's branding

2. **Authentication**
   - Enter your email address
   - If first time:
     - Click the verification link sent to your email
   - Enter the verification code sent to your phone

3. **Select Files**
   - Click "Select Files" or drag files to the upload area
   - Select one or more files from your device
   - Files will be validated for size and type

4. **Add Context (Optional)**
   - Add a description for the upload
   - Select a category if available
   - Add any required metadata

5. **Upload Files**
   - Click "Upload" to start the process
   - Progress bar will show upload status
   - Wait for confirmation message

6. **Confirmation**
   - Receive on-screen confirmation
   - Note the reference number for your upload
   - Optionally download a receipt

### Managing Your Uploads

1. **View Upload History**
   - Log in to the upload portal
   - Navigate to "My Uploads"
   - View status of previous uploads

2. **Upload Again**
   - Use "Upload Again" button for quick access
   - Your authentication will be remembered for a limited time

3. **Get Help**
   - Use "Contact Support" for assistance
   - Reference your upload ID in communications

## Administrator Guide

### System Monitoring

1. **Health Monitoring**
   - Check system dashboard for component status
   - Monitor API response times and error rates
   - Review storage usage and quotas

2. **Security Monitoring**
   - Review authentication attempts
   - Monitor for unusual access patterns
   - Check for failed uploads or API calls

3. **Performance Monitoring**
   - Track upload speeds and success rates
   - Monitor API throughput
   - Check notification delivery times

### Maintenance Tasks

1. **Backup Management**
   - Verify automatic backups are running
   - Test backup restoration periodically
   - Review backup retention policies

2. **Updates and Patches**
   - Apply security updates promptly
   - Schedule feature updates during low-usage periods
   - Test updates in staging environment first

3. **User Management**
   - Audit user access regularly
   - Remove unused accounts
   - Verify phone numbers and emails are current

### Compliance Management

1. **Audit Logs**
   - Review access logs regularly
   - Export logs for compliance reporting
   - Verify log retention meets requirements

2. **Security Controls**
   - Verify encryption settings
   - Check access control configurations
   - Review authentication settings

3. **Compliance Reporting**
   - Generate compliance reports
   - Document security controls
   - Prepare for audits with built-in reports

## Integration Guide

### Zulip Integration

1. **Notification Setup**
   - Configure notification streams in Zulip
   - Customize notification formats
   - Set up filters and alerts

2. **Bot Integration**
   - Configure STUF bot permissions
   - Use bot commands for quick actions
   - Set up automated responses

3. **Webhook Integration**
   - Configure external webhooks
   - Map events to webhook calls
   - Test webhook delivery

### API Integration

1. **Authentication**
   - Generate API keys in admin interface
   - Configure authentication for API clients
   - Set appropriate permissions

2. **Upload API**
   - Use REST API for programmatic uploads
   - Handle responses and error codes
   - Implement retry logic for reliability

3. **Management API**
   - Use API for user management
   - Automate configuration changes
   - Retrieve system status and metrics

### Custom Integrations

1. **Event Hooks**
   - Configure custom event handlers
   - Implement post-upload processing
   - Set up notification routing

2. **Custom Authentication**
   - Integrate with existing identity providers
   - Configure custom authentication flows
   - Map external identities to STUF users

3. **Data Export**
   - Configure automatic exports
   - Set up file transfer to external systems
   - Implement data transformation hooks
