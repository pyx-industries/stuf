Feature: Authentication Flow
  As a user of the STUF system
  I want to authenticate with Keycloak
  So that I can access protected resources

  Scenario: Access protected endpoint with valid token
    Given I have a valid authentication token
    When I request my user information
    Then I should get my user details
