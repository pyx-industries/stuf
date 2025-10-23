Feature: Upload Files to STUF
  As a Project Participant
  I want to upload files to appropriate folders
  So that I can share information with the project

  Background:
    Given I am authenticated to the STUF
    And I am on the file upload interface

  Scenario: Upload file via drag and drop
    When I drag a file from my local device onto the upload area
    Then the system should display the file information
    And I should be prompted to provide required metadata
    When I complete the metadata form
    And I confirm the upload
    Then the system should upload the file
    And I should see a progress indicator during upload
    And I should receive confirmation when the upload is complete
    And the upload should be logged for audit purposes

  Scenario: Upload file via file browser
    When I click the "Select Files" button
    And I select a file using the file browser dialog
    Then the system should display the file information
    And I should be prompted to provide required metadata
    When I complete the metadata form
    And I confirm the upload
    Then the system should upload the file
    And I should receive confirmation when the upload is complete

  Scenario: Upload multiple files
    When I select multiple files for upload
    Then the system should display information for each file
    And I should be prompted to provide metadata for each file
    When I complete all metadata forms
    And I confirm the uploads
    Then the system should upload all files
    And I should see progress indicators for each upload
    And I should receive confirmation when all uploads are complete

  Scenario: Upload with network interruption
    When I select a file for upload
    And I complete the metadata form
    And I confirm the upload
    But my network connection is interrupted during upload
    Then the system should pause the upload
    And the system should provide a retry option
    When my network connection is restored
    And I select the retry option
    Then the system should resume the upload
    And I should receive confirmation when the upload is complete
