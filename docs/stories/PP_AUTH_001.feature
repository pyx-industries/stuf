Feature: Authenticate to STUF
  As a Project Participant
  I want to securely log in to the STUF
  So that I can upload files to the project

  Background:
    Given I have been added as an authorized user to the STUF
    And I have received a welcome email with a magic link

  Scenario: First-time authentication with magic link
    When I click on the magic link in my email
    Then I should be directed to the STUF website
    And I should be prompted to enter my phone number
    When I enter my registered phone number
    Then I should receive an SMS with a one-time password (OTP)
    When I enter the correct OTP
    Then I should be successfully authenticated
    And I should be directed to the STUF upload interface
    And my authentication should be remembered for a reasonable time

  Scenario: Subsequent authentication
    Given I have previously authenticated to the STUF
    When I visit the STUF website
    And I enter my email address
    Then the system should recognize me as an authorized user
    And I should receive an SMS with a one-time password
    When I enter the correct OTP
    Then I should be successfully authenticated
    And I should be directed to the STUF upload interface

  Scenario: Authentication with incorrect OTP
    When I click on the magic link in my email
    And I enter my registered phone number
    And I receive an SMS with an OTP
    But I enter an incorrect OTP
    Then I should see an error message
    And I should be prompted to try again
    When I enter the correct OTP
    Then I should be successfully authenticated

  Scenario: Authentication with expired magic link
    Given my magic link has expired
    When I click on the expired magic link
    Then I should see an error message
    And I should be provided with instructions to request a new magic link
    When I request a new magic link
    Then a new magic link should be sent to my email
