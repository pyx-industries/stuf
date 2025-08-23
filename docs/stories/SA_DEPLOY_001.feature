Feature: Select Deployment Model
  As a System Administrator
  I want to select the appropriate deployment model for STUF
  So that it meets the organization's security and operational requirements

  Background:
    Given I have access to the STUF deployment documentation
    And I have identified the organization's requirements

  Scenario: Select Pyx-hosted deployment
    When I review the deployment options
    And I determine that Pyx-hosted deployment best meets our needs
    And I request a Pyx-hosted STUF instance
    Then I should receive access credentials for the Pyx management interface
    And I should be able to configure the STUF instance through the interface
    And the STUF should be fully managed by Pyx infrastructure

  Scenario: Select self-hosted deployment with Pyx-hosted Zulip
    When I review the deployment options
    And I determine that self-hosted STUF with Pyx-hosted Zulip is appropriate
    And I request the self-hosted deployment package
    Then I should receive the deployment package with necessary scripts
    And I should be able to deploy STUF on our infrastructure
    And the STUF should integrate with Pyx-hosted Zulip for notifications

  Scenario: Select fully self-hosted deployment
    When I review the deployment options
    And I determine that fully self-hosted deployment is required
    And I request the self-hosted deployment package
    Then I should receive the complete deployment package
    And I should be able to deploy both STUF and Zulip on our infrastructure
    And I should have full control over all components of the system

  Scenario: Migrate between deployment models
    Given I have an existing STUF deployment
    When I determine that a different deployment model is needed
    And I request migration assistance
    Then I should receive migration scripts and documentation
    And I should be able to migrate to the new deployment model
    And all existing data and configuration should be preserved
