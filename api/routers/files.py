from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict
import uuid
import io
import json
from datetime import datetime

from auth.middleware import get_current_user, require_role, User
from storage.minio import MinioClient
router = APIRouter()

import logging

logger = logging.getLogger(__name__)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    collection: str = Form(...),
    metadata: str = Form("{}"),
    current_user: User = Depends(get_current_user),
    minio_client: MinioClient = Depends(MinioClient)
):
    """
    Upload a file to a specific collection
    
    - **file**: The file to upload
    - **collection**: The collection to upload to (must have write access)
    - **metadata**: JSON string with additional metadata
    """
    # Check if user has write permission for this collection
    if not current_user.has_collection_permission(collection, "write"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have write access to collection: {collection}"
        )
    
    # Parse metadata
    try:
        metadata_dict = json.loads(metadata)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid metadata JSON format"
        )
    
    # Generate a unique object name
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    object_name = f"{collection}/{current_user.username}/{timestamp}-{file.filename}"
    
    # Add upload metadata
    upload_metadata = {
        "uploader": current_user.username,
        "upload_time": timestamp,
        "collection": collection,
        "original_filename": file.filename,
        **metadata_dict
    }
    
    # Read file content
    file_content = await file.read()
    
    # Upload to MinIO
    try:
        minio_client.upload_file(
            io.BytesIO(file_content),
            object_name,
            file.content_type or "application/octet-stream",
            metadata=upload_metadata
        )
        
        return {
            "status": "success",
            "message": "File uploaded successfully",
            "object_name": object_name,
            "collection": collection,
            "metadata": upload_metadata
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )

@router.get("/list/{collection}")
async def list_files(
    collection: str,
    current_user: User = Depends(get_current_user),
    minio_client: MinioClient = Depends(MinioClient)
):
    """
    List files in a specific collection
    
    - **collection**: The collection to list files from (must have read access)
    """
    # Check if user has read permission for this collection
    if not current_user.has_collection_permission(collection, "read"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have read access to collection: {collection}"
        )
    
    try:
        # List objects with the collection prefix
        objects = minio_client.list_objects(prefix=f"{collection}/")
        return {
            "status": "success",
            "collection": collection,
            "files": objects
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing files: {str(e)}"
        )

@router.get("/download/{collection}/{object_name:path}")
async def download_file(
    collection: str,
    object_name: str,
    current_user: User = Depends(get_current_user),
    minio_client: MinioClient = Depends(MinioClient)
):
    """
    Download a file from a specific collection
    
    - **collection**: The collection the file belongs to (must have read access)
    - **object_name**: The object name in storage
    """
    # Check if user has read permission for this collection
    if not current_user.has_collection_permission(collection, "read"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have read access to collection: {collection}"
        )
    
    # Ensure the object name starts with the collection
    full_object_name = f"{collection}/{object_name}" if not object_name.startswith(f"{collection}/") else object_name
    
    try:
        # Get the file data and metadata
        data, metadata, content_type = minio_client.download_file(full_object_name)
        
        # Return the file as a streaming response
        return StreamingResponse(
            io.BytesIO(data),
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename={metadata.get('original_filename', 'download')}"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found or error downloading: {str(e)}"
        )

# @router.get("/presigned/{collection}/{object_name:path}")
# async def get_presigned_url(
#     collection: str,
#     object_name: str,
#     expires: int = 3600,
#     current_user: User = Depends(get_current_user),
#     minio_client: MinioClient = Depends(MinioClient)
# ):
#     """
#     Get a presigned URL for downloading a file - COMMENTED OUT (YAGNI)
#     
#     - **collection**: The collection the file belongs to
#     - **object_name**: The object name in storage
#     - **expires**: Expiration time in seconds (default: 1 hour)
#     """
#     # Check if user has access to this collection
#     collection_role = f"collection-{collection}"
#     if collection_role not in current_user.roles and "admin" not in current_user.roles:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail=f"You don't have access to collection: {collection}"
#         )
#     
#     # Ensure the object name starts with the collection
#     full_object_name = f"{collection}/{object_name}" if not object_name.startswith(f"{collection}/") else object_name
#     
#     try:
#         # Generate presigned URL
#         url = minio_client.get_presigned_url(full_object_name, expires)
#         
#         return {
#             "status": "success",
#             "url": url,
#             "expires_in": expires
#         }
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"File not found or error generating URL: {str(e)}"
#         )

@router.delete("/{collection}/{object_name:path}")
async def delete_file(
    collection: str,
    object_name: str,
    current_user: User = Depends(require_role("admin")),
    minio_client: MinioClient = Depends(MinioClient)
):
    """
    Delete a file (admin only)
    
    - **collection**: The collection the file belongs to
    - **object_name**: The object name in storage
    """
    # Ensure the object name starts with the collection
    full_object_name = f"{collection}/{object_name}" if not object_name.startswith(f"{collection}/") else object_name
    
    try:
        # Delete the object
        minio_client.delete_object(full_object_name)
        
        return {
            "status": "success",
            "message": "File deleted successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting file: {str(e)}"
        )
