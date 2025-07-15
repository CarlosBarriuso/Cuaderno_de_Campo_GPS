"""
Health check routes
"""

from fastapi import APIRouter, Depends
from datetime import datetime
from loguru import logger

from app.database.connection import check_db_health, get_db_info

router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "cuaderno-campo-api",
        "version": "2.0.0",
        "framework": "FastAPI + Python"
    }


@router.get("/detailed")
async def detailed_health_check():
    """Detailed health check with database status"""
    
    # Check database health
    db_healthy = await check_db_health()
    db_info = await get_db_info()
    
    # Overall status
    status = "healthy" if db_healthy else "unhealthy"
    
    return {
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "service": "cuaderno-campo-api",
        "version": "2.0.0",
        "framework": "FastAPI + Python",
        "checks": {
            "database": {
                "status": "healthy" if db_healthy else "unhealthy",
                "details": db_info
            },
            "api": {
                "status": "healthy",
                "details": {
                    "framework": "FastAPI",
                    "python_version": "3.11+",
                    "endpoint_count": 25
                }
            }
        }
    }


@router.get("/metrics")
async def health_metrics():
    """Health metrics for monitoring"""
    
    db_healthy = await check_db_health()
    db_info = await get_db_info()
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": "running",
        "database": {
            "connected": db_healthy,
            "connection_pool": db_info.get("pool_info", {}),
            "postgis_enabled": "postgis_version" in db_info
        },
        "performance": {
            "response_time_ms": 1,  # Will be updated by middleware
            "requests_per_second": 0,  # Will be updated by middleware
            "error_rate": 0
        }
    }