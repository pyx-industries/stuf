# Configuration Persistence Mechanism

## Overview

The STUF system uses a cloud storage bucket-based persistence mechanism for configuration data, user information, and upload metadata. This approach provides several advantages:

- **Simplicity**: Direct file-based storage without requiring a separate database
- **Durability**: Leverages cloud provider's high-durability object storage
- **Scalability**: Easily scales to handle large numbers of uploads and users
- **Auditability**: Maintains a journal of all changes for compliance and debugging

This document details the structure, access patterns, and implementation considerations for the bucket-based persistence mechanism.

## Bucket Structure

The STUF system organizes data in the storage bucket using the following structure:

```
<bucket>/
├── uploads/
│   ├── <id>/
│   │   ├── metadata.json       # Metadata for a specific upload
│   │   └── data/
│   │       └── <file-name>     # Actual uploaded file(s)
├── uploads.json                # Cache of all upload metadata
├── users/
│   └── <id>.json               # Individual user information
├── users.json                  # Cache of all user information
├── config/
│   ├── stuf_config.json        # Main STUF configuration
│   └── metadata_config.json    # Metadata field configuration
└── journal/
    └── <timestamp>_<id>.json   # Audit log entries
```

## Key Files and Their Purpose

### Upload Data

- **`<bucket>/uploads/<id>/metadata.json`**
  - Contains metadata about a specific upload
  - Includes file information, uploader details, timestamp, and custom metadata
  - Used for searching and filtering uploads

- **`<bucket>/uploads/<id>/data/<file-name>`**
  - The actual uploaded file content
  - Stored with original filename
  - Multiple files may exist for a single upload ID

- **`<bucket>/uploads.json`**
  - Cache of all upload metadata (aggregation of all `metadata.json` files)
  - Improves performance for listing and searching uploads
  - Regenerated when:
    - Cache is missing
    - New upload is created (deleted on write of new upload)
  - Regeneration process:
    - Scans all `<bucket>/uploads/*/metadata.json` files
    - Combines data into a single JSON structure
    - If regeneration fails due to concurrent operations, system will:
      - Check latest `<bucket>/journal/<timestamp>` entry
      - If less than 3 seconds old, sleep briefly and retry
      - Alternatively, issue a 301 redirect to a retry URL with a counter

### User Data

- **`<bucket>/users/<id>.json`**
  - Contains information about a specific authorized user
  - Includes name, email, phone, status, and access history

- **`<bucket>/users.json`**
  - Cache of all user information (aggregation of all user JSON files)
  - Improves performance for listing and managing users
  - Deleted and regenerated when:
    - Any user is created, edited, or deleted
    - Cache is missing
  - Regeneration process:
    - Scans all `<bucket>/users/*.json` files
    - Combines data into a single JSON structure
    - If regeneration fails due to concurrent operations, system will:
      - Check latest `<bucket>/journal/<timestamp>` entry
      - If less than 3 seconds old, sleep briefly and retry
      - Alternatively, issue a 301 redirect to a retry URL with a counter

### Configuration Data

- **`<bucket>/config/stuf_config.json`**
  - Contains the main STUF configuration
  - Includes project name, description, notification settings, etc.
  - Used by the API to determine system behavior

- **`<bucket>/config/metadata_config.json`**
  - Contains configuration for metadata fields
  - Defines which metadata types are enabled/disabled
  - Specifies validation rules, options, and requirements for each field

### Audit Journal

- **`<bucket>/journal/<timestamp>_<id>.json`**
  - Audit log entry for each significant system event
  - Written every time users or uploads change
  - Contains:
    - Timestamp of the event
    - User who performed the action
    - Type of action (create, update, delete)
    - Affected resource ID
    - Before/after state for updates
  - Used for compliance, debugging, and recovery

## Access Patterns

### API Service

The API service interacts with the bucket in the following ways:

1. **Configuration Retrieval**
   - On startup, loads `config/stuf_config.json` and `config/metadata_config.json`
   - Periodically checks for configuration updates (configurable interval)
   - Reloads configuration when changes are detected

2. **User Authentication**
   - Loads `users.json` to verify user credentials
   - If `users.json` is missing, regenerates it from individual user files
   - Updates user access history in individual user files

3. **File Upload**
   - Creates new `uploads/<id>/` directory
   - Writes uploaded file(s) to `uploads/<id>/data/`
   - Creates `uploads/<id>/metadata.json` with upload details
   - Deletes `uploads.json` to trigger regeneration
   - Writes journal entry for the upload event

4. **File Listing/Retrieval**
   - Uses `uploads.json` for efficient listing and searching
   - Regenerates `uploads.json` if missing
   - Accesses individual files directly for download

### Admin Tool

The Admin tool interacts with the bucket in the following ways:

1. **Configuration Management**
   - Reads and writes `config/stuf_config.json` and `config/metadata_config.json`
   - Writes journal entry for configuration changes

2. **User Management**
   - Creates, updates, and deletes `users/<id>.json` files
   - Deletes `users.json` to trigger regeneration
   - Writes journal entry for user changes

3. **Upload Management**
   - Reads `uploads.json` for listing and searching uploads
   - Accesses individual `uploads/<id>/metadata.json` for detailed view
   - Writes journal entry for any upload management actions

## Implementation Considerations

### Concurrency Handling

To handle concurrent operations on the same resources:

1. **Optimistic Concurrency Control**
   - Include version or timestamp in metadata files
   - Check version/timestamp before updates
   - Retry with updated data if conflict detected

2. **Cache Regeneration**
   - Use journal timestamps to detect recent changes
   - Implement exponential backoff for retries
   - Consider using conditional writes (ETag/If-Match) when supported by storage provider

### Error Handling

1. **Missing Files**
   - Implement automatic regeneration of cache files
   - Log warnings for unexpected missing files
   - Provide fallback behavior when possible

2. **Corruption Detection**
   - Validate JSON structure when reading files
   - Maintain checksums for critical files
   - Implement recovery procedures for corrupted files

### Performance Optimization

1. **Caching Strategy**
   - Cache frequently accessed data in memory
   - Implement TTL-based cache invalidation
   - Use conditional GET requests to reduce bandwidth

2. **Batch Operations**
   - Combine multiple small operations when possible
   - Use bulk listing operations for efficiency
   - Consider using parallel operations for large datasets

### Security Considerations

1. **Access Control**
   - Implement bucket policies to restrict access
   - Use IAM roles with least privilege
   - Encrypt data at rest and in transit

2. **Sensitive Data**
   - Encrypt user contact information
   - Store authentication tokens securely
   - Implement key rotation for encryption keys

## Migration and Versioning

As the system evolves, the structure and content of the persisted data may need to change. To handle this:

1. **Schema Versioning**
   - Include a version field in all JSON files
   - Implement version-specific readers and writers
   - Maintain backward compatibility when possible

2. **Migration Process**
   - Implement migration scripts for major changes
   - Consider incremental migrations for large datasets
   - Maintain backup of data before migration

3. **Rollback Strategy**
   - Keep backup of previous state before major changes
   - Implement rollback procedures for failed migrations
   - Test migration and rollback procedures regularly
