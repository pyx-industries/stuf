Feature: Configure Metadata Requirements
  As a Trust Architect
  I want to configure metadata requirements for uploads
  So that appropriate governance information is collected with each file

  Background:
    Given I am logged into the STUF Admin tool
    And I have navigated to the "Metadata Configuration" section for a specific STUF instance

  Scenario: Configure file type metadata
    When I enable the file type metadata category
    And I set it as "Required"
    And I add predefined file type options "Document,Spreadsheet,Image,Code"
    And I enable the "Other (specify)" option
    And I save the configuration
    Then the system should update the metadata configuration
    And project participants should be required to select a file type when uploading
    And participants should be able to specify "Other" file types

  Scenario: Configure IP ownership declaration
    When I enable the IP ownership declaration category
    And I set it as "Required"
    And I add predefined ownership options "My Organization,Third Party,Open Source"
    And I enable the "Legally binding" setting
    And I disable the "Don't know" option
    And I save the configuration
    Then the system should update the metadata configuration
    And project participants should be required to make an IP ownership declaration
    And the declaration should be presented as legally binding

  Scenario: Configure license conditions
    When I enable the license conditions category
    And I set it as "Optional"
    And I add predefined license options "MIT,GPL,Proprietary,CC-BY"
    And I enable free text entry for licenses
    And I save the configuration
    Then the system should update the metadata configuration
    And project participants should be able to specify license conditions
    And participants should be able to enter custom license information

  Scenario: Configure conditional metadata requirements
    When I configure the comments field as "Required" for specific conditions
    And I set comments as required when file type is "Code"
    And I set comments as required when IP ownership is "Third Party"
    And I save the configuration
    Then the system should update the metadata configuration
    And comments should be required only when those specific conditions are met
    And the form should dynamically adjust based on user selections
