Feature: API Functionality
  As a user of the STUF API
  I want to be able to upload and download files
  So that I can securely transfer documents

  Scenario: Health check endpoint works
    Given the API is running
    When I request the health endpoint
    Then I should get a healthy status
