Feature: View Upload History
  As a Project Participant
  I want to view my upload history
  So that I can track what I've shared with the project

  Background:
    Given I am authenticated to the STUF
    And I have previously uploaded files to the project

  Scenario: View personal upload history
    When I navigate to the "Upload History" section
    Then I should see a list of all files I've uploaded
    And the list should show file name, date, and folder for each upload
    And I should be able to sort the list by different columns
    And I should be able to filter my uploads by date or file type

  Scenario: View detailed information about an upload
    When I navigate to the "Upload History" section
    And I select a specific upload from the list
    Then I should see detailed information about the upload
    And I should see all metadata I provided with the upload
    And I should see the current status of the upload
    But I should not be able to download the file again

  Scenario: View project-wide upload history
    When I navigate to the "Project History" section
    Then I should see a list of all files uploaded to the project
    And I should see who uploaded each file and when
    And I should be able to filter the list by uploader or date
    But I should not be able to download files uploaded by others

  Scenario: Search upload history
    When I navigate to the "Upload History" section
    And I enter a search term in the search field
    Then the system should filter the history to show matching uploads
    And I should be able to search by filename, metadata, or comments
    And I should be able to clear the search and see all uploads again

  Scenario: Export upload history
    When I navigate to the "Upload History" section
    And I select the "Export History" option
    And I choose the export format
    Then the system should generate an export of my upload history
    And I should be able to download the export file
    And the export should include all relevant upload metadata
