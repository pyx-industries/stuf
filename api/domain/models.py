# Using Pydantic for domain objects provides runtime validation,
# serialization, and immutable behavior without architectural coupling.

from typing import Any, Dict, List, Optional, Protocol

from pydantic import BaseModel, Field


class AuthenticatedPrincipal(Protocol):
    """Protocol for common authentication/authorization interface"""

    def get_identifier(self) -> str:
        """Get the unique identifier for this principal"""
        ...

    def has_role(self, role: str) -> bool:
        """Check if principal has a specific role"""
        ...

    def is_admin(self) -> bool:
        """Check if principal has admin privileges"""
        ...

    def has_collection_permission(self, collection: str, permission: str) -> bool:
        """Check if principal has specific permission for a collection"""
        ...


class User(BaseModel):
    """Domain model representing a system user with permissions and collections"""

    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    roles: List[str] = []
    collections: Dict[str, List[str]] = {}
    active: bool = True

    def get_identifier(self) -> str:
        """Get the unique identifier for this user"""
        return self.username

    def has_role(self, role: str) -> bool:
        """Check if user has a specific role"""
        return role in self.roles

    def is_admin(self) -> bool:
        """Check if user has admin role"""
        return "admin" in self.roles

    def has_collection_permission(self, collection: str, permission: str) -> bool:
        """Check if user has specific permission for a collection"""
        if self.is_admin():
            return True

        collection_perms = self.collections.get(collection, [])
        return permission in collection_perms

    def can_access_file(self, file: "File", permission: str) -> bool:
        """Check if user can access a specific file with given permission"""
        return self.has_collection_permission(file.collection, permission)


class ServiceAccount(BaseModel):
    """Domain model representing a service account with API access permissions"""

    client_id: str = Field(..., description="Unique client identifier from Keycloak")
    name: str = Field(..., description="Human-readable service account name")
    description: str = Field(
        default="", description="Description of service account purpose"
    )
    roles: List[str] = Field(default_factory=list, description="Assigned roles")
    collections: Dict[str, List[str]] = Field(
        default_factory=dict, description="Collection permissions"
    )
    scopes: List[str] = Field(default_factory=list, description="OAuth2 scopes granted")
    active: bool = Field(default=True, description="Whether service account is active")

    def get_identifier(self) -> str:
        """Get the unique identifier for this service account"""
        return self.client_id

    def has_role(self, role: str) -> bool:
        """Check if service account has a specific role"""
        return role in self.roles

    def is_admin(self) -> bool:
        """Check if service account has admin role"""
        return "admin" in self.roles

    def has_collection_permission(self, collection: str, permission: str) -> bool:
        """Check if service account has specific permission for a collection"""
        if self.is_admin():
            return True

        collection_perms = self.collections.get(collection, [])
        return permission in collection_perms

    def has_scope(self, scope: str) -> bool:
        """Check if service account has a specific OAuth2 scope"""
        return scope in self.scopes

    def can_access_file(self, file: "File", permission: str) -> bool:
        """Check if service account can access a specific file with given permission"""
        return self.has_collection_permission(file.collection, permission)


class File(BaseModel):
    """
    Pure domain model representing a file in the system.

    Contains only business data and validation rules - no infrastructure concerns
    like storage path generation or serialization logic.
    """

    object_name: str = Field(
        ..., description="Full storage path including collection and timestamp"
    )
    collection: str = Field(..., description="Collection this file belongs to")
    owner: str = Field(..., description="Username of the file owner")
    original_filename: str = Field(..., description="Original filename from upload")
    upload_time: str = Field(..., description="ISO timestamp when file was uploaded")
    content_type: str = Field(..., description="MIME type of the file")
    size: Optional[int] = Field(None, description="File size in bytes")
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Additional file metadata"
    )

    def is_owned_by(self, user: "User") -> bool:
        """Check if file is owned by the given user"""
        return self.owner == user.username

    def to_api_dict(self) -> Dict[str, Any]:
        """Convert to dictionary suitable for API responses"""
        return {
            "object_name": self.object_name,
            "collection": self.collection,
            "owner": self.owner,
            "original_filename": self.original_filename,
            "upload_time": self.upload_time,
            "content_type": self.content_type,
            "size": self.size,
            "metadata": self.metadata,
        }
