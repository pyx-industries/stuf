import logging
import os

import uvicorn
from auth.middleware import get_current_principal
from domain.models import AuthenticatedPrincipal, ServiceAccount, User
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import files

app = FastAPI(
    title="STUF API", description="Secure Transfer Upload Facility API", version="0.1.0"
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
        "description": "Secure Transfer Upload Facility API",
    }


@app.get("/api/me")
def get_current_principal_info(
    current_principal: AuthenticatedPrincipal = Depends(get_current_principal),
):
    logger = logging.getLogger(__name__)
    logger.info(f"API /me called for principal: {current_principal.get_identifier()}")
    logger.info(f"Principal collections: {current_principal.collections}")
    logger.info(f"Principal roles: {current_principal.roles}")

    # Add type information to response
    if isinstance(current_principal, User):
        return {
            "type": "user",
            "username": current_principal.username,
            "email": current_principal.email,
            "full_name": current_principal.full_name,
            "roles": current_principal.roles,
            "collections": current_principal.collections,
            "active": current_principal.active,
        }
    elif isinstance(current_principal, ServiceAccount):
        return {
            "type": "service_account",
            "client_id": current_principal.client_id,
            "name": current_principal.name,
            "description": current_principal.description,
            "roles": current_principal.roles,
            "collections": current_principal.collections,
            "scopes": current_principal.scopes,
            "active": current_principal.active,
        }
    else:
        # Fallback for protocol compliance
        return {
            "type": "unknown",
            "identifier": current_principal.get_identifier(),
            "roles": getattr(current_principal, "roles", []),
            "collections": getattr(current_principal, "collections", {}),
            "active": getattr(current_principal, "active", True),
        }


if __name__ == "__main__":
    port = int(os.environ.get("API_PORT", 8000))

    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
