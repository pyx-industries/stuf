Feature: File Upload
  As an authenticated user
  I want to upload files to collections
  So that I can manage my documents

  Scenario: Upload a valid file into a collection
    Given the STUF services are running
    And the application is accessible
    And I am logged in as an admin user
    And I am on the dashboard
    When I select any collection
    And I select a valid file to upload
    And I click the upload button
    Then I should see a success message