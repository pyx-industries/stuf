"""Shared test data and fixtures for all test types"""

# Sample user data
SAMPLE_USERS = {
    "admin": {
        "username": "admin",
        "email": "admin@example.com",
        "full_name": "Admin User",
        "roles": ["admin", "collection-test", "collection-restricted"],
        "active": True
    },
    "user": {
        "username": "testuser",
        "email": "testuser@example.com", 
        "full_name": "Test User",
        "roles": ["user", "collection-test"],
        "active": True
    },
    "limited_user": {
        "username": "limiteduser",
        "email": "limiteduser@example.com",
        "full_name": "Limited User", 
        "roles": ["user", "collection-other"],
        "active": True
    }
}

# Sample file data
SAMPLE_FILES = [
    {
        "name": "test/user/document1.pdf",
        "size": 1024,
        "last_modified": "2023-01-01T10:00:00Z"
    },
    {
        "name": "test/user/image1.jpg", 
        "size": 2048,
        "last_modified": "2023-01-02T11:00:00Z"
    },
    {
        "name": "test/admin/report.xlsx",
        "size": 4096,
        "last_modified": "2023-01-03T12:00:00Z"
    }
]

# Sample metadata
SAMPLE_METADATA = {
    "basic": {
        "description": "Test file",
        "category": "testing"
    },
    "detailed": {
        "description": "Detailed test file",
        "category": "integration",
        "tags": ["test", "sample"],
        "author": "Test Suite"
    }
}

# Sample Keycloak token responses
SAMPLE_TOKEN_RESPONSES = {
    "valid": {
        "active": True,
        "preferred_username": "testuser",
        "email": "testuser@example.com",
        "name": "Test User",
        "realm_access": {"roles": ["user", "collection-test"]}
    },
    "admin": {
        "active": True,
        "preferred_username": "admin",
        "email": "admin@example.com", 
        "name": "Admin User",
        "realm_access": {"roles": ["admin", "collection-test", "collection-restricted"]}
    },
    "inactive": {
        "active": False
    }
}
