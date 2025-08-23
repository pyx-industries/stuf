Feature: Create New STUF Instance
  As a Trust Architect
  I want to set up a new Secure Trusted Upload Facility
  So that I can securely receive confidential files from project participants

  Background:
    Given I am logged into the STUF Admin tool
    And I have the necessary permissions to create a new STUF instance

  Scenario: Successfully create a new STUF instance
    When I select "Create New STUF" option
    And I enter the project name "Project Alpha"
    And I enter the project description "Confidential file collection for Project Alpha"
    And I select "AWS S3" as the storage provider
    And I configure the Zulip stream "project-alpha" for notifications
    And I submit the configuration
    Then the system should validate my configuration
    And the system should provision the necessary infrastructure
    And I should receive a notification when the STUF is ready
    And the STUF should be accessible at a unique URL
    And the STUF should be properly registered with the Admin tool

  Scenario: Create STUF with custom branding
    When I select "Create New STUF" option
    And I enter the required project details
    And I upload a custom logo
    And I select custom color scheme
    And I submit the configuration
    Then the system should create a STUF with my custom branding
    And the STUF interface should display my custom logo and colors

  Scenario: Attempt to create STUF with invalid configuration
    When I select "Create New STUF" option
    And I enter incomplete project details
    And I submit the configuration
    Then the system should display validation errors
    And the system should not proceed with provisioning
    And I should be able to correct the errors and resubmit
