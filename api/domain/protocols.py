# Domain Protocols - Define contracts that external systems must implement

from typing import Protocol, Optional, runtime_checkable


@runtime_checkable
class FileUpload(Protocol):
    """
    Domain abstraction for uploaded files.
    
    This protocol defines what the domain needs from an uploaded file,
    without coupling to any specific framework (FastAPI, Flask, etc.)
    """
    
    filename: Optional[str]
    content_type: Optional[str]
    
    async def read(self) -> bytes:
        """Read the complete file content"""
        ...
    
    def seek(self, offset: int) -> None:
        """Seek to position in file"""
        ...


# Note: FastAPI's UploadFile already implements this protocol!
# No adapter layer needed due to Python's structural typing.