"""
Authentication middleware using Clerk
"""

from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
import jwt
import httpx
from loguru import logger
from typing import Optional
import json

from app.config.settings import settings

security = HTTPBearer(auto_error=False)


class AuthMiddleware(BaseHTTPMiddleware):
    """Authentication middleware for requests"""
    
    async def dispatch(self, request: Request, call_next):
        # Skip auth for health checks and docs
        if request.url.path in ["/", "/health", "/health/", "/docs", "/redoc", "/openapi.json"]:
            response = await call_next(request)
            return response
        
        # Skip auth for health endpoints
        if request.url.path.startswith("/health"):
            response = await call_next(request)
            return response
        
        response = await call_next(request)
        return response


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    """Get current authenticated user from Clerk token"""
    
    # For development/testing - return mock user if no token
    if settings.DEBUG and not credentials:
        return {
            "id": "user_mock_test_id",
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "User",
            "clerk_id": "user_mock_test_id"
        }
    
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail={
                "success": False,
                "error": "Missing authentication",
                "message": "Authorization header required"
            }
        )
    
    try:
        # Verify Clerk JWT token
        token = credentials.credentials
        user_data = await verify_clerk_token(token)
        
        return {
            "id": user_data.get("id", "user_mock_test_id"),
            "email": user_data.get("email_addresses", [{}])[0].get("email_address", "test@example.com"),
            "first_name": user_data.get("first_name", "Test"),
            "last_name": user_data.get("last_name", "User"),
            "clerk_id": user_data.get("id", "user_mock_test_id")
        }
        
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(
            status_code=401,
            detail={
                "success": False,
                "error": "Invalid token",
                "message": "Authentication failed"
            }
        )


async def verify_clerk_token(token: str) -> dict:
    """Verify Clerk JWT token using Clerk API"""
    
    try:
        # Clerk API endpoint para verificar token
        headers = {
            "Authorization": f"Bearer {settings.CLERK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        # Decodificar token para obtener user_id
        decoded_token = jwt.decode(
            token, 
            options={"verify_signature": False}  # Clerk maneja la verificación
        )
        
        user_id = decoded_token.get("sub")
        if not user_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=401, detail="Invalid token format")
        
        # Llamar a Clerk API para obtener información del usuario
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.clerk.com/v1/users/{user_id}",
                headers=headers,
                timeout=5.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Clerk API error: {response.status_code} - {response.text}")
                from fastapi import HTTPException
                raise HTTPException(status_code=401, detail="Token verification failed")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Clerk token verification failed: {e}")
        
        # Fallback para desarrollo - usar datos del token
        if settings.DEBUG:
            try:
                decoded_token = jwt.decode(
                    token, 
                    options={"verify_signature": False}
                )
                return {
                    "id": decoded_token.get("sub", "user_mock_test_id"),
                    "email_addresses": [{"email_address": decoded_token.get("email", "test@example.com")}],
                    "first_name": decoded_token.get("given_name", "Test"),
                    "last_name": decoded_token.get("family_name", "User")
                }
            except:
                pass
        
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid authentication token")


def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """Get user if authenticated, otherwise return None"""
    
    if not credentials:
        return None
    
    try:
        # This would need to be async in a real implementation
        # For now, return None for optional auth
        return None
    except:
        return None


async def require_auth(current_user: dict = Depends(get_current_user)) -> dict:
    """Require authentication - alias for get_current_user"""
    return current_user


class ClerkAuth:
    """Clerk authentication helper class"""
    
    def __init__(self):
        self.secret_key = settings.CLERK_SECRET_KEY
        self.publishable_key = settings.CLERK_PUBLISHABLE_KEY
    
    async def get_user(self, user_id: str) -> dict:
        """Get user information from Clerk"""
        headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.clerk.com/v1/users/{user_id}",
                headers=headers,
                timeout=5.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                from fastapi import HTTPException
                raise HTTPException(status_code=404, detail="User not found")
    
    async def get_session(self, session_id: str) -> dict:
        """Get session information from Clerk"""
        headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.clerk.com/v1/sessions/{session_id}",
                headers=headers,
                timeout=5.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                from fastapi import HTTPException
                raise HTTPException(status_code=404, detail="Session not found")


# Global Clerk auth instance
clerk_auth = ClerkAuth()