Feature: Manage Project Participants
  As a Trust Architect
  I want to manage project participants and their access
  So that only authorized users can upload specific types of artifacts

  Background:
    Given I am logged into the STUF Admin tool
    And I have a STUF instance "Project Alpha" already created
    And I have navigated to the user management section

  Scenario: Add new authorized user
    When I select "Add User" option
    And I enter the user's email "john.doe@example.com"
    And I enter the user's phone number "+61412345678"
    And I enter the user's name "John Doe"
    And I select appropriate roles for the user
    And I save the user details
    Then the system should add the user to the authorized users list
    And the system should send a welcome email with magic link to the user
    And the user should appear in the authorized users list

  Scenario: Edit existing user
    When I select an existing user "jane.smith@example.com" from the list
    And I update the user's phone number to "+61487654321"
    And I modify the user's roles
    And I save the changes
    Then the system should update the user's information
    And the system should apply the new role assignments
    And the user should receive a notification about the changes

  Scenario: Disable user access
    When I select an existing user "robert.johnson@example.com" from the list
    And I change the user's status to "Disabled"
    And I save the changes
    Then the system should prevent the user from authenticating
    And the user should remain in the list with "Disabled" status
    And any active sessions for the user should be terminated

  Scenario: Bulk import users
    When I select "Import Users" option
    And I upload a CSV file with user details
    And I map the CSV columns to user attributes
    And I confirm the import
    Then the system should validate the user data
    And the system should add all valid users to the authorized users list
    And the system should report any validation errors
    And welcome emails should be sent to all newly added users
