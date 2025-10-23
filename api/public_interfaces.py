from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class BaseResponse(BaseModel):
    """Base response model with common fields"""

    status: str = Field(..., description="Response status")
    message: Optional[str] = Field(None, description="Response message")


class UploadFileRequest(BaseModel):
    """Request model for file upload operations"""

    collection: str = Field(..., description="Collection to upload the file to")
    metadata: str = Field(default="{}", description="JSON metadata for the file")


class UploadFileResponse(BaseResponse):
    """Response model for successful file uploads"""

    object_name: str = Field(..., description="Generated object name in storage")
    collection: str = Field(..., description="Collection the file was uploaded to")
    metadata: Dict[str, Any] = Field(
        ..., description="File metadata including upload info"
    )


class ListFilesRequest(BaseModel):
    """Request model for listing files in a collection"""

    collection: str = Field(..., description="Collection to list files from")


class ListFilesResponse(BaseResponse):
    """Response model for file listing operations"""

    collection: str = Field(..., description="Collection that was queried")
    files: List[Dict[str, Any]] = Field(
        ..., description="List of files in the collection"
    )


class DownloadFileRequest(BaseModel):
    """Request model for downloading files"""

    collection: str = Field(..., description="Collection the file belongs to")
    object_name: str = Field(..., description="Object path within the collection")


class DeleteFileRequest(BaseModel):
    """Request model for deleting files"""

    collection: str = Field(..., description="Collection the file belongs to")
    object_name: str = Field(..., description="Object path within the collection")


class DeleteFileResponse(BaseResponse):
    """Response model for file deletion operations"""

    pass  # Inherits status and message from BaseResponse
