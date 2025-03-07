# Combined Pyx and Non-Pyx User Management for STUFs

## Overview
As a Trust Architect (TA), I need to be able to authorize both Pyx platform users and external project participants to access my Secure Trusted Upload Facility (STUF) so that I can seamlessly work with mixed teams.

## User Story
**As a** Trust Architect  
**I want to** authorize both Pyx platform users and external participants to access my STUF  
**So that** I can work with mixed teams without creating duplicate accounts

## Implementation Note
This feature requires the next generation Pyx platform authentication and account management system with Multi-Factor Authentication (MFA) support. It builds upon the existing STUF user management but extends it to integrate with Pyx platform user accounts.

## Acceptance Criteria

### 1. Combined User Management Interface
- TA can add both Pyx platform users and external participants to a STUF
- UI clearly distinguishes between Pyx users and external participants
- TA can search for existing Pyx users to add them to a STUF
- TA can still manually add external participants with name, email, and phone

### 2. Pyx User Integration
- System automatically retrieves Pyx user profile information (name, email)
- System verifies Pyx users have MFA enabled before allowing STUF access
- Pyx users can access STUFs without additional authentication if already logged into Pyx
- Pyx user permissions for STUFs are integrated with Pyx platform roles

### 3. External User Management
- External participants continue to use email+SMS verification
- System maintains separate tracking for external participant access
- External participants can be converted to Pyx users if they later join the platform
- External participant management maintains all existing functionality

### 4. Unified Access Control
- TA can set permissions that apply consistently to both user types
- Access logs show both Pyx and external user activity in a unified view
- Revocation of access works consistently for both user types
- Notification of access events is consistent for both user types

## Technical Implementation Details

### User Identity Management
- Integration with Pyx platform identity provider
- Unified user identity model that accommodates both user types
- Mapping between external identities and Pyx identities when users migrate

### Authentication Flows
- Pyx users: SSO with MFA verification
- External users: Email link + SMS code verification
- Session management appropriate to each user type

### MFA Requirements
- Verification of MFA status for Pyx users
- Enforcement of MFA policy for STUF access
- Guidance for enabling MFA when required

## Dependencies
- Next generation Pyx platform authentication system
- Pyx platform MFA implementation
- Pyx user directory API
- STUF user management system

## Risks and Mitigations
| Risk | Mitigation |
|------|------------|
| Inconsistent user experience | Unified design language, clear user type indicators |
| MFA adoption barriers | Clear guidance, phased rollout |
| User confusion about access methods | Contextual help, clear documentation |
| Identity conflicts during migration | Robust conflict resolution process |

## Timeline
- Design and architecture: 3 weeks
- Implementation: 4 weeks
- Testing and refinement: 2 weeks
- Documentation and training: 1 week
- Total estimated time: 10 weeks
