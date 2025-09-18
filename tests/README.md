# STUF E2E Browser Testing

This directory contains **true** end-to-end testing infrastructure using Playwright to test the complete user journey through the STUF application, from browser-based authentication via Keycloak OIDC to file operations through the React SPA.

## Problem Statement

The existing E2E tests in `api/tests/e2e/` only validate API endpoints with mocked authentication tokens obtained via password grant. This approach misses critical failure modes where:

- The SPA's OIDC authentication flow fails
- Frontend JavaScript errors prevent API calls
- CORS or network connectivity issues between SPA and API
- UI state management problems during authentication
- Keycloak redirect handling issues
- Real browser rendering and interaction problems

This gap has led to situations where all tests pass but manual testing through the browser fails.

## Solution Architecture

### Technology Stack

- **Playwright Python**: Browser automation with native Python integration
- **pytest-bdd**: BDD testing with Gherkin feature files for readable test specifications
- **Docker**: Isolated, reproducible test environments
- **Allure**: Rich HTML reporting with screenshots and execution traces
- **Page Object Model**: Maintainable, reusable page interaction patterns

### Test Environment Architecture

**Clean Separation: External Test Runner + Containerized Services**

```
┌─────────────────────────────────┐    ┌───────────────────────────┐
│           Host System           │    │       Docker Network     │
│                                 │    │      (stuf-test-net)      │
│  ┌─────────────────────────────┐│    │                           │
│  │     Test Runner (Host)      ││    │  ┌─────────────────────┐  │
│  │                             ││    │  │     Keycloak        │  │
│  │  • Python/Playwright       ││────│  │   localhost:8080    │  │
│  │  • pytest-bdd             ││    │  └─────────────────────┘  │
│  │  • Browser (Chrome/FF)     ││    │                           │
│  │                             ││    │  ┌─────────────────────┐  │
│  └─────────────────────────────┘│    │  │     React SPA       │  │
│                                 │    │  │   localhost:3000    │  │
│  ┌─────────────────────────────┐│    │  └─────────────────────┘  │
│  │   Test Artifacts (Host)     ││    │                           │
│  │                             ││    │  ┌─────────────────────┐  │
│  │  • reports/screenshots/    ││    │  │     FastAPI         │  │
│  │  • reports/videos/         ││    │  │   localhost:8000    │  │
│  │  • reports/test-report.html││    │  └─────────────────────┘  │
│  │                             ││    │                           │
│  └─────────────────────────────┘│    │  ┌─────────────────────┐  │
└─────────────────────────────────┘    │  │       MinIO         │  │
                                       │  │   localhost:9000    │  │
                                       │  └─────────────────────┘  │
                                       └───────────────────────────┘
```

## Design Decisions

### 1. **Playwright over Selenium/Cypress**

**Chosen: Playwright Python**

*Rationale:*
- Native Python integration matches the FastAPI backend stack
- Modern, fast, reliable browser automation with auto-waiting
- Excellent Docker support and headless execution
- Built-in network interception for API request validation
- Superior debugging with traces, screenshots, and video recording
- Cross-browser testing (Chromium, Firefox, WebKit) in single framework

*Rejected Alternatives:*
- Selenium: Heavier, more complex setup, legacy WebDriver protocol
- Cypress: JavaScript-only, doesn't match Python stack, limited cross-browser support
- TestCafe: Smaller ecosystem, less integration flexibility

### 2. **BDD with pytest-bdd**

**Chosen: Gherkin Features + Python Step Definitions**

*Rationale:*
- Business-readable test specifications using Given/When/Then syntax
- Clear separation between test logic and scenario descriptions
- Reusable step definitions across multiple scenarios
- Natural fit with existing pytest infrastructure
- Stakeholder-friendly reporting showing business scenarios

### 3. **Global Authentication Setup**

**Chosen: Storage State Pattern**

*Rationale:*
- Authenticate once per test session, reuse across all tests
- Dramatically faster test execution (authentication is expensive)
- Tests focus on business logic, not authentication mechanics
- Real browser-based OIDC flow ensures auth compatibility
- Storage state includes cookies, localStorage, sessionStorage

### 4. **Page Object Model Architecture**

**Chosen: Class-based Page Objects with Async/Await**

*Rationale:*
- Encapsulates page-specific locators and interactions
- Reduces test maintenance when UI changes
- Promotes reusable, composable page interactions
- Clean separation between test logic and implementation details

### 5. **External Test Runner Strategy**

**Chosen: Host-based Test Runner + Containerized Services**

*Rationale:*
- Simpler development workflow (no container complexity for test runner)
- Direct artifact access on host filesystem
- Easier debugging with local browser installation
- Services isolated in Docker network while keeping test execution simple
- No complex volume mounting or browser container management

## Directory Structure

```
tests/
└── e2e-browser/                    # Browser-based E2E tests
    ├── README.md                   # This file
    ├── requirements.txt            # Python dependencies
    ├── playwright.config.py        # Playwright configuration
    ├── conftest.py                 # Shared pytest fixtures
    ├── global-setup.py             # Authentication state setup
    ├── docker-compose.e2e-browser.yml # Test environment services
    │
    ├── features/                   # BDD feature files
    │   ├── authentication.feature  # Login/logout scenarios
    │   ├── file-upload.feature     # File upload workflows
    │   ├── file-management.feature # List, download, delete operations
    │   ├── collections.feature     # Collection-based permissions
    │   └── error-handling.feature  # Error scenarios and edge cases
    │
    ├── step_definitions/           # BDD step implementations
    │   ├── __init__.py
    │   ├── authentication_steps.py
    │   ├── file_operations_steps.py
    │   ├── navigation_steps.py
    │   └── assertions_steps.py
    │
    ├── pages/                      # Page Object Models
    │   ├── __init__.py
    │   ├── base_page.py           # Common page functionality
    │   ├── login_page.py          # Keycloak authentication
    │   ├── dashboard_page.py      # Main application dashboard
    │   ├── file_upload_page.py    # File upload interface
    │   ├── collections_page.py    # Collection management
    │   └── error_page.py          # Error handling pages
    │
    ├── utils/                      # Test utilities and helpers
    │   ├── __init__.py
    │   ├── keycloak_helper.py     # Keycloak API interactions
    │   ├── test_data.py           # Test data generation
    │   ├── api_client.py          # Direct API calls for setup/teardown
    │   └── screenshot_helper.py    # Enhanced screenshot utilities
    │
    └── reports/                    # Test execution artifacts
        ├── screenshots/            # Failure screenshots
        ├── videos/                # Test execution recordings
        ├── traces/                # Playwright execution traces
        └── allure-results/        # Allure report data
```

## Test Coverage Strategy

### Core User Journeys

1. **Complete Authentication Flow**
   - SPA initialization and OIDC configuration
   - Keycloak redirect and login form interaction
   - Token exchange and callback handling
   - SPA state update with user information
   - Persistent session across page refreshes

2. **File Upload Workflows**
   - File selection and metadata entry
   - Upload progress and success feedback
   - Collection-based file organization
   - Permission validation and error handling

3. **File Management Operations**
   - File listing with metadata display
   - File download functionality
   - File deletion (admin users)
   - Search and filtering capabilities

4. **Collection-Based Access Control**
   - Multiple collection access scenarios
   - Permission boundary enforcement
   - Admin vs regular user capabilities
   - Cross-collection access prevention

5. **Error Scenarios and Edge Cases**
   - Network connectivity issues
   - Invalid authentication states
   - File upload failures and retries
   - Browser refresh during operations
   - Session expiration handling

### Browser Compatibility Testing

- **Chromium**: Primary testing target (matches most users)
- **Firefox**: Cross-browser validation
- **WebKit**: Safari compatibility (optional)
- **Mobile Viewports**: Responsive design validation

### Performance and Reliability Testing

- **Network Conditions**: Slow 3G simulation for upload scenarios
- **Concurrent Users**: Multiple browser instances for load testing
- **Memory Leaks**: Long-running session validation
- **File Size Limits**: Large file upload boundary testing

## Implementation Roadmap

### Phase 1: Foundation
- [ ] Docker compose setup for test services
- [ ] Playwright configuration and host setup
- [ ] Basic page object models for core pages
- [ ] Global authentication setup with storage state
- [ ] Simple smoke test for SPA → API connectivity
- [ ] **Add CI/CD integration and branch protection**
- [ ] **Wire up GitHub Actions to run `make test-e2e-browser`**
- [ ] **Enable branch protection: require E2E tests to pass before merge**

### Phase 2: Core Authentication Testing
- [ ] Complete OIDC flow testing with BDD scenarios
- [ ] Multiple user role testing (testuser, limiteduser, admin)
- [ ] Session management and token refresh validation
- [ ] Authentication error handling and recovery

### Phase 3: File Operations
- [ ] File upload workflows with various file types
- [ ] File listing and metadata validation
- [ ] Download functionality across browsers
- [ ] File deletion with proper permission checks

### Phase 4: Advanced Scenarios
- [ ] Collection-based multi-tenancy testing
- [ ] Concurrent user interactions
- [ ] Network failure simulation and recovery
- [ ] Performance testing with large files

### Phase 5: CI/CD Integration
- [ ] GitHub Actions workflow integration
- [ ] Makefile target refinement and optimization
- [ ] Automated failure investigation with traces
- [ ] Reporting and notification improvements

## TODO: Implementation Checklist

### Infrastructure Setup
- [ ] Create `requirements.txt` with Playwright and BDD dependencies
- [ ] Configure `playwright.config.py` with proper browser settings
- [ ] Create `docker-compose.e2e-browser.yml` for test services only
- [ ] Create `global-setup.py` for authentication state management
- [ ] Configure `conftest.py` with shared fixtures and browser context setup
- [ ] Add `tests/e2e-browser/reports/` to `.gitignore` (generated artifacts, not source code)

### Page Object Models
- [ ] Implement `base_page.py` with common page functionality
- [ ] Create `login_page.py` for Keycloak authentication interactions
- [ ] Build `dashboard_page.py` for main application interface
- [ ] Develop `file_upload_page.py` for upload workflow testing
- [ ] Design `collections_page.py` for collection management testing

### BDD Feature Implementation
- [ ] Write `authentication.feature` with login/logout scenarios
- [ ] Create `file-upload.feature` with comprehensive upload workflows
- [ ] Develop `file-management.feature` for listing, download, delete operations
- [ ] Design `collections.feature` for permission-based testing
- [ ] Implement `error-handling.feature` for edge case coverage

### Step Definitions
- [ ] Implement authentication step definitions with proper waiting strategies
- [ ] Create file operation steps with upload progress validation
- [ ] Build navigation steps for consistent page transitions
- [ ] Develop assertion steps with meaningful error messages

### Utility Functions
- [ ] Create `keycloak_helper.py` for direct Keycloak API interactions
- [ ] Implement `test_data.py` for consistent test data generation
- [ ] Build `api_client.py` for setup/teardown operations
- [ ] Develop `screenshot_helper.py` for enhanced failure debugging

### Test Scenarios
- [ ] Implement complete OIDC authentication flow validation
- [ ] Create multi-browser compatibility test matrix
- [ ] Build file upload testing with various file types and sizes
- [ ] Develop collection-based permission boundary testing
- [ ] Implement session management and token refresh testing

### Error Handling and Debugging
- [ ] Configure automatic screenshot capture on failures
- [ ] Setup video recording for complex workflow debugging
- [ ] Implement Playwright trace collection for execution analysis
- [ ] Create custom error messages with context information

### Reporting and Documentation
- [ ] Setup Allure reporting with rich HTML output
- [ ] Configure screenshot and video embedding in reports
- [ ] Create execution time and performance metrics collection
- [ ] Implement failure analysis and categorization

### Makefile Integration and Target Refinement
- [ ] **Rename existing test targets for clarity:**
  - `test-e2e` → `test-api-e2e` (current API-only E2E tests)
  - Add new `test-e2e-browser` for true browser-based E2E tests
  - Update `test-e2e` to run both API and browser E2E tests
  - Rename `test-all` → `test-complete` for comprehensive testing

- [ ] **Add new Makefile targets:**
  ```makefile
  # Environment management  
  test-e2e-browser-env-up:    Start browser E2E services (Docker)
  test-e2e-browser-env-down:  Stop and clean browser E2E services
  test-e2e-browser-env-logs:  Show E2E service logs
  
  # Browser E2E testing
  test-e2e-browser:           Run browser E2E tests (starts services if needed)
  test-e2e-browser-ci:        Run browser tests in headless CI mode
  test-e2e-browser-debug:     Run browser tests with debugging enabled
  
  # Combined testing
  test-e2e:                   Run both API and browser E2E tests
  test-complete:              Run all test types (unit, integration, API E2E, browser E2E)
  
  # Test utilities
  test-e2e-browser-clean:     Clean test reports and artifacts
  test-e2e-browser-report:    Open HTML test report in browser
  ```

- [ ] **Environment variable management:**
  - Create separate `.env.e2e` for E2E-specific configuration
  - Document required environment variables for browser testing
  - Setup CI/CD environment variable templates

- [ ] **Dependencies and prerequisites:**
  - Add browser dependency checking to Makefile
  - Create `make install-e2e-deps` target for setup
  - Document system requirements for browser testing

### CI/CD Integration
- [ ] Create GitHub Actions workflow for browser E2E testing
- [ ] Setup artifact collection for screenshots, videos, and reports
- [ ] Configure parallel test execution for faster CI runs
- [ ] Implement failure notification and reporting
- [ ] Create performance regression detection

### Performance and Optimization
- [ ] Implement test parallelization strategies
- [ ] Create browser pool management for efficient resource usage
- [ ] Setup test data cleanup and isolation
- [ ] Configure proper test timeouts and retry mechanisms
- [ ] Implement smart test selection based on code changes

### Documentation and Training
- [ ] Create developer onboarding guide for E2E testing
- [ ] Document test writing best practices and patterns
- [ ] Create troubleshooting guide for common issues
- [ ] Setup team training materials for BDD and Playwright

## Success Metrics

### Coverage Metrics
- **Authentication Flow Coverage**: 100% of OIDC authentication scenarios tested
- **API Endpoint Coverage**: All user-facing API endpoints validated through browser
- **User Role Coverage**: All user roles (admin, regular, limited) tested
- **Browser Coverage**: Core functionality validated across Chromium, Firefox
- **Error Scenario Coverage**: All major error conditions and recovery paths tested

### Quality Metrics
- **Test Reliability**: <2% flaky test rate (tests pass consistently)
- **Execution Speed**: Full E2E suite completes in <10 minutes
- **Failure Detection**: 100% of manual testing scenarios automated
- **Debugging Efficiency**: Failure root cause identifiable within 5 minutes using artifacts

### Development Workflow Metrics
- **Developer Confidence**: No more "tests pass but manual testing fails" scenarios
- **Regression Prevention**: E2E tests catch UI/API integration regressions before production
- **Release Quality**: Zero authentication or file operation bugs in production releases
- **Team Productivity**: Reduced manual testing time by 80%

## Clean Execution Flow

**Makefile → Docker Services → Host Tests → Host Artifacts**

```bash
# 1. Start test environment
make test-e2e-browser-env-up
# → docker-compose -f tests/e2e-browser/docker-compose.e2e-browser.yml up -d
# → Services: Keycloak:8080, SPA:3000, API:8000, MinIO:9000

# 2. Run browser tests (host-based)
make test-e2e-browser  
# → cd tests/e2e-browser
# → python -m pytest --html=reports/report.html features/

# 3. View results
make test-e2e-browser-report
# → open tests/e2e-browser/reports/report.html

# 4. Clean up
make test-e2e-browser-env-down
# → docker-compose -f tests/e2e-browser/docker-compose.e2e-browser.yml down -v
```

**Artifact Collection Flow:**
```
tests/e2e-browser/reports/
├── report.html                          # Main test report
├── screenshots/
│   ├── test_auth_failure_001.png        # Referenced in report.html
│   └── test_upload_success_002.png      # Referenced in report.html  
├── videos/
│   ├── test_complete_workflow.webm      # Referenced in report.html
│   └── test_auth_flow.webm              # Referenced in report.html
└── traces/
    ├── test_login_trace.zip             # Playwright execution trace
    └── test_upload_trace.zip            # Playwright execution trace
```

**Why This Design is Clean:**

1. **Clear Separation**: Docker handles infrastructure, host handles test execution
2. **Simple Artifacts**: All screenshots, videos, reports stay on host filesystem
3. **No Volume Mounting**: No complex Docker volume management for test results
4. **Easy Development**: Tests run locally with direct browser access for debugging
5. **Minimal Docker Complexity**: Services-only containers, no test runner containers
6. **Clean Repository**: Test artifacts are gitignored (generated files, not source code)

This comprehensive browser-based E2E testing infrastructure will ensure that when we say "E2E tests pass," we can be confident that the complete user experience works as expected, eliminating the gap between automated testing and real-world usage.