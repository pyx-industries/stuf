# Secure Trusted Upload Facility (STUF)

## Purpose and Intent

The Secure Trusted Upload Facility (STUF) is designed to solve a critical challenge faced by organizations: **How to securely receive confidential files from project participants while maintaining the highest standards of security, privacy, and trust.**

### Core Problem

Organizations frequently need to collect sensitive information from external collaborators, including:

- Intellectual property
- Confidential documents
- Research data
- Compliance materials
- Proprietary code

Traditional file sharing methods often fall short in security, auditability, or ease of use, forcing organizations to choose between security and usability.

### The STUF Solution

STUF provides a trusted, secure mechanism for receiving confidential files with:

1. **Strong Security by Design**
   - Two-factor authentication (email + SMS verification)
   - Encrypted storage with strict access controls
   - Comprehensive audit logging
   - Secure file validation and scanning

2. **Trust Through Transparency**
   - "Code under glass" approach provides complete visibility
   - All deployed code and configuration is preserved in a private git repository
   - Trust Architects have read access to verify security implementations
   - No hidden processes or black-box operations

3. **Flexible Deployment Options**
   - Fully managed (Pyx-hosted Zulip + Pyx-hosted STUF)
   - Hybrid (Pyx-hosted Zulip + Self-hosted STUF)
   - Fully self-hosted (Self-hosted Zulip + Self-hosted STUF)
   - Clear migration paths between deployment models

4. **Seamless Integration**
   - Deep integration with Zulip for notifications and management
   - Pluggable Django app for Trust Architect administration
   - API-based architecture for future integrations

5. **Governance-Focused Metadata**
   - Configurable metadata collection for uploads
   - IP ownership declarations
   - License condition tracking
   - Customizable fields based on project requirements

## Key Differentiators

What makes STUF different from other file upload solutions:

- **Earned Trust**: Complete transparency into the system's operation
- **Governance First**: Built for sensitive IP and compliance scenarios
- **User-Centric**: Simple, intuitive interfaces for all technical levels
- **Deployment Freedom**: No vendor lock-in with multiple hosting options
- **Purpose-Built**: Designed specifically for secure, trusted file collection

## Architecture

STUF consists of five main components:

1. **Single Page Application (SPA)** - User-facing interface for file uploads
2. **API Service** - Backend service handling authentication and file uploads
3. **Storage Bucket** - Cloud-based storage for files and configuration
4. **Pluggable Django App** - Management interface for Trust Architects
5. **Database** - Stores system configuration and user information

## Getting Started

For detailed information on deploying and using STUF, please refer to:

- [Technical Architecture](docs/technical_architecture.md)
- [User Guides](docs/user_guides/index.md)
- [Deployment Documentation](docs/deployment/index.md)
- [Implementation Guide](docs/implementation_guide.md)
- [Operations Guide](docs/operations_guide.md)

## Vision and Roadmap

STUF is continuously evolving to meet the needs of organizations requiring secure file uploads. For information on upcoming features and enhancements, see our [Vision and Roadmap](docs/vision_and_roadmap.md).

## Local Development with Docker Compose

STUF can be run locally using Docker Compose for development and testing purposes.

### Prerequisites

- Docker and Docker Compose installed on your system
- Git for cloning the repository

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/pyx-industries/stuf.git
   cd stuf
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Start the Docker Compose environment:
   ```bash
   docker-compose up -d
   ```

4. Access the components:
   - SPA: http://localhost:3000
   - API: http://localhost:8000
   - Keycloak Admin Console: http://localhost:8080/admin (admin/admin)
   - MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

### Environment Components

- **Keycloak**: Authentication and authorization server
- **MinIO**: S3-compatible object storage
- **API**: FastAPI backend service
- **SPA**: React frontend application

### Stopping the Environment

To stop the Docker Compose environment:
```bash
docker-compose down
```

To stop and remove volumes (will delete all data):
```bash
docker-compose down -v
```
