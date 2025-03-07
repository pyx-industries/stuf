# Secure Trusted Upload Facility (STUF) - Implementation Guide

## Development Environment Setup

### Prerequisites

- Python 3.8+
- Node.js 14+
- Docker and Docker Compose
- AWS CLI or Azure CLI (depending on cloud provider)
- Git

### Local Development Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/pyx-io/stuf.git
   cd stuf
   ```

2. **Set Up Python Environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

3. **Set Up Frontend Environment**

   ```bash
   cd spa
   npm install
   cd ..
   ```

4. **Configure Local Environment**

   Create a `.env` file in the project root:

   ```
   # API Configuration
   API_DEBUG=true
   API_PORT=8000
   
   # Storage Configuration
   STORAGE_PROVIDER=local  # Use local storage for development
   STORAGE_PATH=./local-storage
   
   # Authentication Configuration
   AUTH_SECRET_KEY=development-secret-key
   AUTH_TOKEN_EXPIRY=3600
   
   # Zulip Integration
   ZULIP_URL=http://localhost:9991
   ZULIP_API_KEY=development-api-key
   ZULIP_EMAIL=bot@example.com
   ```

5. **Start Development Services**

   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

6. **Run API Service**

   ```bash
   cd api
   uvicorn main:app --reload --port 8000
   ```

7. **Run SPA Development Server**

   ```bash
   cd spa
   npm run dev
   ```

8. **Access Development Environment**

   - API: http://localhost:8000
   - SPA: http://localhost:3000
   - API Documentation: http://localhost:8000/docs
   - Zulip (if running locally): http://localhost:9991

## Coding Standards

### Python Code Standards

- Follow PEP 8 style guide
- Use type hints for all function parameters and return values
- Document all modules, classes, and functions with docstrings
- Maximum line length of 100 characters
- Use pytest for unit and integration tests
- Maintain minimum 90% test coverage for all modules

### JavaScript/TypeScript Code Standards

- Use TypeScript for all new code
- Follow Airbnb JavaScript Style Guide
- Use ESLint and Prettier for code formatting
- Document all components, functions, and interfaces
- Use Jest for unit tests and Cypress for E2E tests
- Maintain minimum 85% test coverage for all modules

### Git Workflow

- Use feature branches for all changes
- Branch naming convention: `feature/description`, `bugfix/description`, `hotfix/description`
- Require pull requests for all changes to main branch
- Require code review before merging
- Squash commits when merging to main
- Write descriptive commit messages following conventional commits format

## Testing Strategy

### Unit Testing

- Test individual functions and components in isolation
- Mock external dependencies
- Focus on edge cases and error handling
- Run automatically on every commit

### Integration Testing

- Test interactions between components
- Test API endpoints with realistic data
- Test database operations
- Run automatically on pull requests

### End-to-End Testing

- Test complete user flows
- Test in an environment similar to production
- Include authentication and file upload tests
- Run automatically before deployment

### Security Testing

- Static code analysis for security vulnerabilities
- Dependency scanning for known vulnerabilities
- Regular penetration testing
- Compliance verification tests

## CI/CD Pipeline

### Continuous Integration

The CI pipeline runs on every push and pull request:

1. **Linting and Static Analysis**
   - Python: flake8, mypy, bandit
   - JavaScript: ESLint, TypeScript compiler

2. **Unit Tests**
   - Python: pytest with coverage
   - JavaScript: Jest with coverage

3. **Integration Tests**
   - API endpoint tests
   - Component integration tests

4. **Build Verification**
   - Build Docker images
   - Build SPA production assets

### Continuous Deployment

The CD pipeline runs when changes are merged to main:

1. **Environment Preparation**
   - Create or update deployment environment
   - Configure environment variables

2. **Deployment**
   - Deploy API service
   - Deploy SPA assets
   - Update configuration

3. **Post-Deployment Verification**
   - Smoke tests
   - Health checks
   - Security verification

4. **Rollback Procedure**
   - Automatic rollback on failed verification
   - Manual rollback option for Trust Architects

## Metadata Configuration Implementation

### Metadata Types and Optionality

The STUF system is designed with flexibility in metadata collection. Trust Architects can:

1. **Enable or Disable Entire Metadata Categories**
   - Each metadata type (file types, collections, IP ownership, license conditions, comments) can be:
     - Fully enabled and required
     - Enabled but optional
     - Completely disabled/not collected

2. **Configuration Options for Each Metadata Type**
   - For each enabled metadata type, configure:
     - Predefined lists of values
     - Whether free text entry is allowed
     - Whether "Don't know" or "Other (specify)" options are allowed
     - Help text and validation rules

3. **Implementation Considerations**
   - UI should dynamically adjust based on enabled metadata types
   - Storage schema should support nullable fields for optional metadata
   - API validation should enforce required fields based on configuration
   - Reporting should handle missing metadata fields gracefully
   - Configuration is stored in `<bucket>/config/metadata_config.json`
   - API reads configuration at startup and periodically checks for updates

4. **Default Configuration**
   - By default, only basic description is required
   - All other metadata types are optional until explicitly configured
   - Initial configuration is created during STUF provisioning

### Implementation Examples

**Example 1: Minimal Metadata Configuration**
```json
{
  "metadata_config": {
    "description": {"required": true},
    "file_type": {"enabled": false},
    "collection": {"enabled": false},
    "ip_ownership": {"enabled": false},
    "license": {"enabled": false},
    "comments": {"required": false}
  }
}
```

**Example 2: Full Metadata Configuration**
```json
{
  "metadata_config": {
    "description": {"required": true},
    "file_type": {
      "enabled": true,
      "required": true,
      "allow_other": true,
      "allow_unknown": false,
      "options": ["Document", "Spreadsheet", "Image", "Code"]
    },
    "collection": {
      "enabled": true,
      "required": false,
      "allow_other": true,
      "allow_unknown": true,
      "options": ["Project A", "Project B", "Research", "Administrative"]
    },
    "ip_ownership": {
      "enabled": true,
      "required": true,
      "allow_free_text": false,
      "allow_unknown": false,
      "legally_binding": true,
      "options": ["My Organization", "Third Party", "Open Source"]
    },
    "license": {
      "enabled": true,
      "required": true,
      "allow_free_text": true,
      "allow_unknown": false,
      "options": ["MIT", "GPL", "Proprietary", "CC-BY"]
    },
    "comments": {
      "required": false,
      "required_for": {
        "file_type": ["Code"],
        "ip_ownership": ["Third Party"],
        "license": ["Proprietary"]
      }
    }
  }
}
```

## Feature Implementation Process

### Feature Planning

1. **Requirements Gathering**
   - Document user stories and acceptance criteria
   - Define technical requirements
   - Identify security considerations

2. **Design**
   - Create technical design document
   - Review design with team
   - Update architecture documentation if needed

### Implementation

1. **Development**
   - Create feature branch
   - Implement code following coding standards
   - Write tests for new functionality

2. **Code Review**
   - Submit pull request
   - Address review comments
   - Ensure all tests pass

3. **Testing**
   - Verify functionality in development environment
   - Perform security review
   - Test with realistic data

### Deployment

1. **Staging Deployment**
   - Deploy to staging environment
   - Perform user acceptance testing
   - Verify performance and security

2. **Production Deployment**
   - Schedule production deployment
   - Monitor deployment process
   - Verify functionality post-deployment

3. **Documentation**
   - Update user documentation
   - Update technical documentation
   - Communicate changes to users

## Troubleshooting and Debugging

### Common Issues

1. **API Connection Issues**
   - Verify network connectivity
   - Check API service logs
   - Verify authentication configuration

2. **Storage Access Problems**
   - Verify storage credentials
   - Check bucket permissions
   - Review storage service logs

3. **Authentication Failures**
   - Verify user is in authorized users list
   - Check SMS/email delivery logs
   - Verify token configuration

### Debugging Tools

1. **API Debugging**
   - Enable debug logging with `API_DEBUG=true`
   - Use API documentation at `/docs` for testing
   - Check application logs

2. **SPA Debugging**
   - Use browser developer tools
   - Enable Vue/React developer tools
   - Check browser console for errors

3. **Integration Debugging**
   - Use request/response logging
   - Check Zulip API logs
   - Verify webhook delivery

## Conclusion

This implementation guide provides the foundation for developing, testing, and deploying the Secure Trusted Upload Facility. By following these guidelines, developers can ensure a consistent, high-quality implementation that meets the security and functionality requirements of the system.
