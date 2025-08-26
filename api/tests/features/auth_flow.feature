Feature: Authentication Flow
  As a developer
  I want to understand the authentication flow
  So that I can implement client applications correctly

  Scenario: SPA redirects unauthenticated users to Keycloak
    Given a user is not authenticated
    When they access the SPA
    Then they should be redirected to Keycloak for login

  Scenario: Keycloak returns authorization code after login
    Given a user has valid credentials
    When they log in through Keycloak
    Then Keycloak should redirect back with an authorization code

  Scenario: SPA exchanges code for tokens
    Given the SPA has received an authorization code from Keycloak
    When the SPA exchanges the code for tokens
    Then the SPA should receive access and refresh tokens

  Scenario: API validates tokens with Keycloak
    Given the SPA has a valid access token
    When the SPA makes an API request with the token
    Then the API should validate the token with Keycloak introspection endpoint

  Scenario: API processes requests with valid tokens
    Given the API has validated a token as active
    When processing the API request
    Then the API should extract user information and process the request

  Scenario: API rejects requests with invalid tokens
    Given the API receives an invalid or expired token
    When validating the token with Keycloak
    Then the API should return a 401 unauthorized response

  Scenario: OAuth2 scheme configuration
    Given the API uses OAuth2AuthorizationCodeBearer for authentication
    Then the authorizationUrl should point to Keycloak's auth endpoint
    And the tokenUrl should point to Keycloak's token endpoint
    And the refreshUrl should point to Keycloak's token endpoint

  Scenario: Role-based access control
    Given I am authenticated as "testuser" with roles "collection-test"
    When I make a GET request to "/api/files/list/test"
    Then I should receive a 200 status code

    When I make a GET request to "/api/files/list/other-collection"
    Then I should receive a 403 status code
