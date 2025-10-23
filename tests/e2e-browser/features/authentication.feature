Feature: Authentication
  As a user of the STUF system
  I want to authenticate using OIDC
  So that I can access the application securely

  Background:
    Given the STUF services are running
    And the application is accessible

  Scenario: Successful login with valid credentials
    Given I navigate to the STUF application
    When I click the login button
    And I am redirected to the IDP login page
    And I enter valid admin credentials
    And I click the IDP login button
    Then I should be redirected back to the application
    And I should see the dashboard
    And I should be logged in as an authenticated user

  Scenario: Login failure with invalid credentials
    Given I navigate to the STUF application
    When I click the login button
    And I am redirected to the IDP login page
    And I enter invalid credentials
    And I click the IDP login button
    Then I should see an authentication error message
    And I should remain on the login page

  Scenario: Successful logout
    Given I am logged in as an admin user
    And I am on the dashboard
    When I click the logout button
    Then I should be logged out
    And I should be redirected to the login page when accessing protected content

  Scenario: Direct access to protected route when not authenticated
    Given I am not authenticated
    When I try to access the application directly
    Then I should be redirected to the login page
    And I should see the login form

  Scenario: Authentication with different user roles
    Given I navigate to the STUF application
    When I log in as a "regular" user
    Then I should be successfully authenticated
    And I should see the dashboard appropriate for my role