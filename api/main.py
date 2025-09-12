from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from auth.middleware import get_current_user
from domain.models import User
from routers import files

app = FastAPI(
    title="STUF API",
    description="Secure Transfer Upload Facility API",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this should be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(files.router, prefix="/api/files", tags=["files"])

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "stuf-api"}

@app.get("/api/info")
def info():
    return {
        "name": "STUF API",
        "version": "0.1.0",
        "description": "Secure Transfer Upload Facility API"
    }

@app.get("/api/me")
def get_current_user_info(current_user: User = Depends(get_current_user)):
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"API /me called for user: {current_user.username}")
    logger.info(f"User collections: {current_user.collections}")
    logger.info(f"User roles: {current_user.roles}")
    return current_user

@app.get("/api/debug")
def debug_endpoint():
    import logging
    logger = logging.getLogger(__name__)
    logger.info("DEBUG: Debug endpoint called - API changes are loaded")
    return {"debug": "API changes loaded successfully"}

if __name__ == "__main__":
    port = int(os.environ.get("API_PORT", 8000))
    
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
