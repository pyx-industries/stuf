Feature: STUF API Functionality
  As a developer
  I want to understand the API functionality
  So that I can use it correctly in my applications

  Scenario: Health check endpoint
    When I make a GET request to "/api/health"
    Then I should receive a 200 status code
    And the response should contain a "status" field with value "healthy"
    And the response should contain a "service" field with value "stuf-api"

  Scenario: API information endpoint
    When I make a GET request to "/api/info"
    Then I should receive a 200 status code
    And the response should contain a "name" field with value "STUF API"
    And the response should contain a "version" field with value "0.1.0"
    And the response should contain a "description" field with value "Secure Transfer Upload Facility API"

  Scenario: Protected endpoints require authentication
    When I make a GET request to "/api/me" without authentication
    Then I should receive a 401 status code

    When I make a GET request to "/api/files/list/test-collection" without authentication
    Then I should receive a 401 status code

    When I make a POST request to "/api/files/upload" without authentication
    Then I should receive a 401 status code

  Scenario: Current user endpoint returns user information
    Given I am authenticated as "testuser" with roles "user,collection-test"
    When I make a GET request to "/api/me"
    Then I should receive a 200 status code
    And the response should contain a "username" field with value "testuser"
    And the response should contain a "roles" field with values "user,collection-test"

  Scenario: List files endpoint returns files from a collection
    Given I am authenticated as "testuser" with roles "collection-test"
    And there are files in the "test" collection
    When I make a GET request to "/api/files/list/test"
    Then I should receive a 200 status code
    And the response should contain a "status" field with value "success"
    And the response should contain a "collection" field with value "test"
    And the response should contain a "files" array
