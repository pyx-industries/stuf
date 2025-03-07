# Administrator Guide

## System Monitoring

1. **Health Monitoring via Zulip**
   - All system events, alarms, and warnings are sent to Zulip streams
   - Configure notification preferences in Zulip for different alert levels
   - Set up Zulip mobile notifications for critical alerts

2. **Error Tracking with Sentry**
   - Monitor application errors and exceptions in Sentry dashboard
   - Review Python stack traces for detailed debugging
   - Set up alert thresholds and notification rules in Sentry

3. **Performance Monitoring**
   - Track upload speeds and success rates via Zulip notifications
   - Monitor API throughput metrics
   - Check notification delivery times

   > Note: More comprehensive logging and advanced audit features are planned for future releases.

## Maintenance Tasks

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
   - Review metadata configuration for completeness and clarity

   > Note: CSV-based user management and combined user management features are planned for future releases.

4. **Metadata Configuration Review**
   - Review which metadata types are enabled and which are disabled
   - For each enabled metadata type:
     - Verify that file type lists are current and complete (if enabled)
     - Ensure collection lists are appropriate for the project (if enabled)
     - Review IP ownership options (if enabled):
       - Verify predefined ownership options match organizational requirements
       - Ensure options comply with legal and governance requirements
       - Check if "Don't know" option is appropriately configured based on governance needs
       - Verify that free text options (if enabled) have appropriate validation
     - Review license condition options (if enabled):
       - Ensure license options are up-to-date with current licensing standards
       - Verify license options comply with organizational policies
       - Check if additional documentation requirements are properly configured
       - Ensure "Don't know" option is appropriately configured based on governance needs
     - Check that comment fields are appropriately configured for file types/collections/ownership/licenses
     - Check that "Other (specify)" options are properly configured where needed
     - Verify that help text for each field is clear and provides adequate guidance
   - Confirm that the metadata configuration aligns with project governance requirements
   - Verify that required vs. optional settings for each metadata type are appropriate

## Compliance Management

1. **Basic Audit Logs**
   - Review Docker logs in CloudWatch
   - Examine journal/<timestamp>_<event_id>.json files in storage bucket
   - Verify log retention meets requirements

   > Note: Advanced audit logging, comprehensive logging, and enhanced compliance reporting features are planned for future releases.

2. **Security Controls**
   - Verify encryption settings
   - Check access control configurations
   - Review authentication settings

3. **Basic Compliance Documentation**
   - Document security controls
   - Prepare basic audit documentation

   > Note: Enhanced compliance reporting tools are planned for future releases.
