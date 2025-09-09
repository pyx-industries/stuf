Feature: Provide File Metadata
  As a Project Participant
  I want to provide metadata for my uploads
  So that files are properly categorized and documented

  Background:
    Given I am authenticated to the STUF
    And I have selected a file to upload
    And the metadata form is displayed

  Scenario: Complete required metadata fields
    When I am presented with the metadata form
    Then required fields should be clearly marked
    When I complete all required metadata fields
    And I submit the form
    Then the system should validate my entries
    And the system should proceed with the file upload
    And the metadata should be stored with the file

  Scenario: Provide file type metadata
    When I select a file type from the predefined options
    And I complete other required metadata
    And I submit the form
    Then the system should associate the file type with my upload
    And the file type should be visible in the upload history

  Scenario: Declare IP ownership
    When I select an IP ownership option from the predefined list
    And I acknowledge the legally binding nature of the declaration
    And I complete other required metadata
    And I submit the form
    Then the system should record my IP ownership declaration
    And the declaration should be associated with my upload

  Scenario: Provide license conditions
    When I select license conditions from the predefined options
    And I provide any required additional documentation
    And I complete other required metadata
    And I submit the form
    Then the system should record the license conditions
    And the license information should be associated with my upload

  Scenario: Add optional comments
    When I add comments in the comments field
    And I complete all required metadata
    And I submit the form
    Then the system should store my comments with the upload
    And the comments should be visible in the upload details
