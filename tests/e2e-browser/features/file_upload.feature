Feature: File Upload
  As an authenticated user
  I want to upload files to collections
  So that I can manage my documents

  Scenario: Upload a valid file into a collection
    Given the STUF services are running
    And the application is accessible
    And I am logged in as an admin user
    And I am on the dashboard
    When I select the "test" collection
    And I select the file 'sample-valid.pdf' to upload to the 'test' collection
    And I click the upload button
    Then I should see a success message
    Then I should see the file 'sample-valid.pdf' listed in the 'test' collection