Feature: Access Uploaded Files
  As a Trust Architect
  I want to access all files uploaded to the project
  So that I can review and process the submitted information

  Background:
    Given I am logged into the STUF Admin tool
    And I have navigated to the "Files" section for a specific STUF instance

  Scenario: Browse uploaded files
    When I view the file browser interface
    Then I should see all files uploaded to the STUF
    And I should see metadata for each file
    And I should be able to sort files by upload date, filename, or uploader
    And I should be able to filter files by metadata attributes

  Scenario: Preview supported file types
    When I select a supported file type in the browser
    Then the system should display a preview of the file
    And the preview should be displayed in a secure viewer
    And I should be able to close the preview and return to the browser

  Scenario: Download individual file
    When I select a file in the browser
    And I choose the "Download" option
    Then the system should initiate a secure download
    And the file should be downloaded to my local system
    And the download should be logged for audit purposes

  Scenario: Download multiple files
    When I select multiple files in the browser
    And I choose the "Download" option
    Then the system should offer to create a zip archive
    When I confirm the zip download
    Then the system should create and download the zip archive
    And the download should be logged for audit purposes

  Scenario: Organize files into folders
    When I select one or more files in the browser
    And I choose the "Move to Folder" option
    And I select or create a destination folder
    Then the system should move the files to the specified folder
    And the files should appear in the new folder location
    And the original upload metadata should be preserved
