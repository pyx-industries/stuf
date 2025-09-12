from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict
import io

from auth.middleware import get_current_user, require_role
from domain import (
    User, File as DomainFile, FileUpload,
    InsufficientPermissionsError, 
    InvalidMetadataError, 
    FileUploadError, 
    FileListingError, 
    FileDownloadError, 
    FileDeleteError, 
    FileNotFoundError,
    StorageRepository
)
from infrastructure.container import get_storage_repository
from usecases.upload_file import UploadFileUseCase
from usecases.list_files import ListFilesUseCase
from usecases.download_file import DownloadFileUseCase
from usecases.delete_file import DeleteFileUseCase
from public_interfaces import UploadFileRequest, UploadFileResponse, ListFilesRequest, ListFilesResponse, DownloadFileRequest, DeleteFileRequest, DeleteFileResponse

router = APIRouter()

import logging

logger = logging.getLogger(__name__)

@router.post("/upload", response_model=UploadFileResponse)

async def upload_file(
    file: UploadFile = File(...),
    collection: str = Form(...),
    metadata: str = Form("{}"),
    current_user: User = Depends(get_current_user),
    storage_repo: StorageRepository = Depends(get_storage_repository)
):
    """
    Upload a file to a specific collection
    
    - **file**: The file to upload
    - **collection**: The collection to upload to (must have write access)
    - **metadata**: JSON string with additional metadata
    """
    try:
        # Use dependency injection - no concrete instantiation!
        use_case = UploadFileUseCase(storage_repo)
        request = UploadFileRequest(collection=collection, metadata=metadata)
        
        # Execute use case - returns domain File object
        # FastAPI UploadFile implements FileUpload protocol
        domain_file = await use_case.execute(request, file, current_user)
        
        # Convert domain result to API response
        return UploadFileResponse(
            status="success",
            message="File uploaded successfully",
            object_name=domain_file.object_name,
            collection=domain_file.collection,
            metadata=domain_file.metadata
        )
    except InsufficientPermissionsError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except InvalidMetadataError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except FileUploadError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/list/{collection}", response_model=ListFilesResponse)
async def list_files(
    collection: str,
    current_user: User = Depends(get_current_user),
    storage_repo: StorageRepository = Depends(get_storage_repository)
):
    """
    List files in a specific collection
    
    - **collection**: The collection to list files from (must have read access)
    """
    try:
        # Use dependency injection - no concrete instantiation!
        use_case = ListFilesUseCase(storage_repo)
        request = ListFilesRequest(collection=collection)
        
        # Execute use case - returns list of domain File objects
        domain_files = use_case.execute(request, current_user)
        
        # Convert domain results to API response
        files_data = [file.to_api_dict() for file in domain_files]
        return ListFilesResponse(
            status="success",
            collection=collection,
            files=files_data
        )
    except InsufficientPermissionsError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except FileListingError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/download/{collection}/{object_name:path}")
async def download_file(
    collection: str,
    object_name: str,
    current_user: User = Depends(get_current_user),
    storage_repo: StorageRepository = Depends(get_storage_repository)
):
    """
    Download a file from a specific collection
    
    - **collection**: The collection the file belongs to (must have read access)
    - **object_name**: The object name in storage
    """
    try:
        # Use dependency injection - no concrete instantiation!
        use_case = DownloadFileUseCase(storage_repo)
        request = DownloadFileRequest(collection=collection, object_name=object_name)
        
        # Execute use case - returns content and domain File object
        file_content, file_metadata = use_case.execute(request, current_user)
        
        # Extract original filename from metadata or use fallback
        original_filename = (
            file_metadata.metadata.get('original_filename') or 
            file_metadata.original_filename or
            object_name.split('/')[-1] or
            'download'
        )
        
        # Create StreamingResponse from domain objects
        return StreamingResponse(
            io.BytesIO(file_content.read()),
            media_type=file_metadata.content_type,
            headers={
                "Content-Disposition": f"attachment; filename={original_filename}"
            }
        )
    except InsufficientPermissionsError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except FileDownloadError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


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

@router.delete("/{collection}/{object_name:path}", response_model=DeleteFileResponse)
async def delete_file(
    collection: str,
    object_name: str,
    current_user: User = Depends(get_current_user),
    storage_repo: StorageRepository = Depends(get_storage_repository)
):
    """
    Delete a file (requires delete permission for collection)
    
    - **collection**: The collection the file belongs to
    - **object_name**: The object name in storage
    """
    try:
        # Use dependency injection - no concrete instantiation!
        use_case = DeleteFileUseCase(storage_repo)
        delete_request = DeleteFileRequest(collection=collection, object_name=object_name)
        
        # Execute use case - returns boolean success
        success = use_case.execute(delete_request, current_user)
        
        # Convert domain result to API response
        return DeleteFileResponse(
            status="success",
            message="File deleted successfully"
        )
    except InsufficientPermissionsError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except FileDeleteError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

