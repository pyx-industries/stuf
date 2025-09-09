# Epic: Metadata Configuration for Uploads

## Overview
As a Trust Architect (TA), I need to configure the metadata requirements for file uploads so that I can collect the necessary information about ownership, licensing, and other governance aspects of submitted files, ensuring proper documentation and compliance for all uploaded content.

## User Story
**As a** Trust Architect  
**I want to** configure metadata requirements for file uploads  
**So that** I can collect appropriate governance information with each submission and ensure compliance with project requirements

## Acceptance Criteria

### 1. Metadata Field Configuration
- TA can enable/disable each metadata category:
  - File type classification
  - Collection designation
  - IP ownership declaration
  - License conditions
  - Comments/notes
- For each enabled category, TA can configure:
  - Whether the field is required or optional
  - Help text/description to guide users
  - Validation rules where applicable

### 2. Predefined Options Management
- TA can define preset options for each metadata category:
  - File types (e.g., source code, documentation, design files)
  - Collections (e.g., project areas, modules, components)
  - IP ownership declarations (e.g., personal work, employer-owned, third-party)
  - License conditions (e.g., proprietary, open source licenses, public domain)
- TA can add, edit, and remove options for each category
- TA can set default selections where appropriate

### 3. Advanced Configuration Options
- TA can configure whether "Other" or "Don't know" options are allowed for each category
- TA can require additional explanation when "Other" or "Don't know" is selected
- TA can configure whether free text entry is allowed for certain fields
- TA can set up conditional metadata requirements (e.g., specific license information required only for certain file types)

### 4. Legal Declaration Settings
- TA can configure whether IP ownership declarations are legally binding
- TA can customize the legal text displayed for binding declarations
- TA can require explicit acknowledgment of terms for uploads
- TA can configure whether additional documentation is required for certain declarations

### 5. Metadata Form Preview
- TA can preview the metadata collection form as it will appear to users
- Preview updates in real-time as configuration changes are made
- TA can test the form flow including conditional fields
- TA can save draft configurations before publishing

### 6. Configuration Management
- TA can save and load metadata configurations
- TA can create configuration templates for reuse across projects
- TA can export and import configurations
- System maintains version history of configuration changes

## Detailed Flow

### Initial Configuration Setup
1. TA logs into the STUF Admin tool
2. TA selects a specific STUF instance
3. TA navigates to the "Metadata Configuration" section
4. System displays the current metadata configuration or default settings
5. TA can enable/disable each metadata category
6. For each enabled category, TA configures required status and other options

### Managing Predefined Options
1. TA selects a metadata category to configure (e.g., "File Types")
2. System displays the current list of predefined options
3. TA can add new options with:
   - Display name
   - Description/help text
   - Default status
4. TA can edit or remove existing options
5. TA can reorder options to control display order
6. System validates changes to prevent duplicates or empty values

### Configuring Advanced Options
1. TA configures whether "Other" or "Don't know" options are allowed
2. If allowed, TA configures whether additional explanation is required
3. TA configures whether free text entry is allowed for specific fields
4. TA sets up any conditional logic between fields
5. System validates the configuration for logical consistency

### Setting Up Legal Declarations
1. TA configures whether IP ownership declarations are legally binding
2. If binding, TA enters or edits the legal text to be displayed
3. TA configures whether explicit acknowledgment is required
4. TA configures any additional documentation requirements
5. System provides guidance on legal best practices

### Previewing the Metadata Form
1. TA selects "Preview Form" option
2. System generates a preview of the metadata collection form
3. TA can interact with the preview to test user experience
4. TA can make adjustments and see real-time updates
5. TA can test conditional logic by selecting different options

### Saving and Publishing Configuration
1. TA reviews the complete configuration
2. TA can save as draft or publish the configuration
3. If publishing, system prompts for confirmation
4. System saves the configuration to the storage bucket
5. System updates the STUF instance to use the new configuration
6. TA receives confirmation of successful update

## Technical Implementation Details

### Data Model
- Metadata configuration stored as JSON in the storage bucket
- Configuration includes:
  - Enabled/disabled status for each category
  - Required/optional status for each field
  - Predefined options for each category
  - Conditional logic rules
  - Legal declaration settings
  - Help text and descriptions

### Storage Structure
- Configuration stored in `<bucket>/config/metadata_config.json`
- Version history maintained in `<bucket>/config/history/`
- Templates stored in `<bucket>/config/templates/`

### User Interface Components
- React-based configuration interface with:
  - Toggle switches for enabling/disabling categories
  - Drag-and-drop for reordering options
  - Rich text editor for legal text
  - Interactive form preview
  - Validation feedback

### Security Considerations
- All configuration changes are logged for audit purposes
- Configuration changes require appropriate permissions
- System validates configurations to prevent security issues
- Legal text changes are versioned for compliance purposes

## Dependencies
- STUF Admin tool
- Storage bucket access
- Form rendering engine for preview functionality
- Version control for configuration history

## Timeline
- Basic configuration interface: 1 week
- Predefined options management: 3-4 days
- Advanced configuration options: 3-4 days
- Legal declaration settings: 2-3 days
- Form preview functionality: 3-4 days
- Testing and refinement: 3-4 days
- Total estimated time: 3-4 weeks
