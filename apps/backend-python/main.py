"""
Cuaderno de Campo GPS - FastAPI Backend
Migración desde Node.js a Python FastAPI
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer
import uvicorn
from loguru import logger

from app.config.settings import settings
from app.database.connection import init_db, close_db
from app.middleware.auth import AuthMiddleware
from app.middleware.logging import LoggingMiddleware
from app.routes import health, parcelas, actividades, sigpac, ocr, weather, user, sync, auth, subscription


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("🚀 Starting Cuaderno de Campo GPS API...")
    await init_db()
    logger.info("✅ Database connected")
    
    yield
    
    # Shutdown
    logger.info("🔄 Shutting down Cuaderno de Campo GPS API...")
    await close_db()
    logger.info("✅ Database disconnected")


# Create FastAPI app
app = FastAPI(
    title="Cuaderno de Campo GPS API",
    description="Backend API para gestión agrícola con GPS y análisis avanzado",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Security
security = HTTPBearer(auto_error=False)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parse_cors_origins(settings.CORS_ORIGINS),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.parse_allowed_hosts(settings.ALLOWED_HOSTS)
)

# Custom middlewares
app.add_middleware(AuthMiddleware)
app.add_middleware(LoggingMiddleware)

# Routes
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(subscription.router, prefix="/api/v1/subscription", tags=["subscription"])
app.include_router(parcelas.router, prefix="/api/v1/parcelas", tags=["parcelas"])
app.include_router(actividades.router, prefix="/api/v1/actividades", tags=["actividades"])
app.include_router(sigpac.router, prefix="/api/v1/sigpac", tags=["sigpac"])
app.include_router(ocr.router, prefix="/api/v1/ocr", tags=["ocr"])
app.include_router(weather.router, prefix="/api/v1/weather", tags=["weather"])
app.include_router(user.router, prefix="/api/v1/user", tags=["user"])
app.include_router(sync.router, prefix="/api/v1/sync", tags=["sync"])

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "error": "Route not found",
            "message": f"Cannot {request.method} {request.url.path}"
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "message": "Something went wrong"
        }
    )

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "🌾 Cuaderno de Campo GPS API",
        "version": "2.0.0",
        "status": "running",
        "framework": "FastAPI + Python",
        "docs": "/docs" if settings.DEBUG else None
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )