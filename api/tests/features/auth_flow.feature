Feature: Authentication Flow
  As a developer
  I want to understand the authentication flow
  So that I can implement client applications correctly

  Scenario: Authentication flow overview
    Given the STUF API uses Keycloak for authentication
    Then the authentication flow should follow these steps:
      | step | description                                                |
      | 1    | SPA redirects to Keycloak for authentication               |
      | 2    | User logs in through Keycloak                              |
      | 3    | Keycloak redirects back to SPA with authorization code     |
      | 4    | SPA exchanges code for tokens                              |
      | 5    | SPA uses access token for API requests                     |
      | 6    | API validates token with Keycloak                          |
      | 7    | If valid, API processes the request                        |

  Scenario: Token validation with Keycloak
    Given a JWT token from Keycloak
    When the API validates the token
    Then it should make a request to the Keycloak introspection endpoint
    And it should extract user information from the validated token

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
