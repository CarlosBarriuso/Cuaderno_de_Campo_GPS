"""
Authentication routes for Clerk integration
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from loguru import logger
from typing import Optional, Dict, Any

from app.middleware.auth import get_current_user, get_optional_user, clerk_auth
from app.config.settings import settings

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: str
    token: Optional[str] = None


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Login endpoint - For development only
    In production, Clerk handles authentication on frontend
    """
    
    try:
        # For development mode, return mock authentication
        if settings.DEBUG:
            # Mock authentication response
            mock_user = {
                "id": "user_mock_test_id",
                "email": request.email,
                "first_name": "Test",
                "last_name": "User",
                "clerk_id": "user_mock_test_id"
            }
            
            # Mock JWT token for development
            mock_token = "mock_jwt_token_for_development"
            
            return LoginResponse(
                success=True,
                data=mock_user,
                message="Authentication successful (development mode)",
                token=mock_token
            )
        else:
            # In production, redirect to Clerk authentication
            raise HTTPException(
                status_code=501,
                detail={
                    "success": False,
                    "error": "Not implemented",
                    "message": "Use Clerk authentication in production"
                }
            )
            
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Authentication failed",
                "message": str(e)
            }
        )


@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user information with subscription details"""
    
    try:
        # Get user subscription data (mock for now)
        user_subscription = {
            "plan": "basico",
            "status": "active", 
            "hectareasLimite": 25,
            "hectareasUsadas": 12,
            "fechaInicio": "2025-01-15T00:00:00Z",
            "fechaVencimiento": "2025-08-15T00:00:00Z",
            "precio": 24.99,
            "moneda": "EUR"
        }
        
        return {
            "success": True,
            "data": {
                "id": current_user.get("id"),
                "email": current_user.get("email"),
                "firstName": current_user.get("first_name"),
                "lastName": current_user.get("last_name"),
                "authenticated": True,
                "clerk_id": current_user.get("clerk_id"),
                "subscription": user_subscription,
                "user": current_user
            }
        }
        
    except Exception as e:
        logger.error(f"Get user info error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Failed to get user information",
                "message": str(e)
            }
        )


@router.get("/status")
async def get_auth_status(current_user: Optional[dict] = Depends(get_optional_user)):
    """Check authentication status"""
    
    try:
        if current_user:
            return {
                "success": True,
                "data": {
                    "authenticated": True,
                    "user_id": current_user.get("id"),
                    "email": current_user.get("email"),
                    "clerk_id": current_user.get("clerk_id")
                }
            }
        else:
            return {
                "success": True,
                "data": {
                    "authenticated": False,
                    "user_id": None,
                    "email": None,
                    "clerk_id": None
                }
            }
            
    except Exception as e:
        logger.error(f"Auth status error: {e}")
        return {
            "success": False,
            "data": {
                "authenticated": False,
                "error": str(e)
            }
        }


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout endpoint"""
    
    try:
        # En un entorno real, invalidaríamos el token en Clerk
        # Por ahora, simplemente devolvemos una respuesta exitosa
        
        logger.info(f"User {current_user.get('email')} logged out")
        
        return {
            "success": True,
            "data": {
                "message": "Logged out successfully",
                "user_id": current_user.get("id")
            }
        }
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Logout failed",
                "message": str(e)
            }
        )


@router.get("/user/{user_id}")
async def get_user_by_id(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get user information by ID (admin or self only)"""
    
    try:
        # Check if user is requesting their own info
        if current_user.get("id") != user_id:
            # In a real app, check for admin permissions here
            raise HTTPException(
                status_code=403,
                detail={
                    "success": False,
                    "error": "Forbidden",
                    "message": "You can only access your own user information"
                }
            )
        
        # Get user data from Clerk
        user_data = await clerk_auth.get_user(user_id)
        
        return {
            "success": True,
            "data": {
                "user": user_data,
                "clerk_id": user_data.get("id"),
                "email": user_data.get("email_addresses", [{}])[0].get("email_address"),
                "first_name": user_data.get("first_name"),
                "last_name": user_data.get("last_name"),
                "created_at": user_data.get("created_at"),
                "updated_at": user_data.get("updated_at")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user by ID error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Failed to get user information",
                "message": str(e)
            }
        )


@router.get("/session/{session_id}")
async def get_session_info(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get session information"""
    
    try:
        # Get session data from Clerk
        session_data = await clerk_auth.get_session(session_id)
        
        return {
            "success": True,
            "data": {
                "session": session_data,
                "session_id": session_data.get("id"),
                "user_id": session_data.get("user_id"),
                "status": session_data.get("status"),
                "created_at": session_data.get("created_at"),
                "updated_at": session_data.get("updated_at")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get session info error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Failed to get session information",
                "message": str(e)
            }
        )


@router.get("/config")
async def get_auth_config():
    """Get authentication configuration for frontend"""
    
    try:
        return {
            "success": True,
            "data": {
                "clerk_publishable_key": settings.CLERK_PUBLISHABLE_KEY,
                "debug_mode": settings.DEBUG,
                "auth_provider": "clerk",
                "endpoints": {
                    "me": "/auth/me",
                    "status": "/auth/status",
                    "logout": "/auth/logout"
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Get auth config error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Failed to get authentication configuration",
                "message": str(e)
            }
        )