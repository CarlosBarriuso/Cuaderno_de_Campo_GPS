"""
Database connection and session management
"""

from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
import asyncpg
from loguru import logger

from app.config.settings import settings

# SQLAlchemy Base
Base = declarative_base()

# Database engines
engine = None
async_engine = None
SessionLocal = None
AsyncSessionLocal = None

# Database URL for asyncpg
async_database_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")


async def init_db():
    """Initialize database connection"""
    global engine, async_engine, SessionLocal, AsyncSessionLocal
    
    try:
        # Create async engine
        async_engine = create_async_engine(
            async_database_url,
            echo=settings.DEBUG,
            poolclass=NullPool if settings.DEBUG else None
        )
        
        # Create sync engine for certain operations
        engine = create_engine(
            settings.DATABASE_URL,
            echo=settings.DEBUG
        )
        
        # Create session makers
        AsyncSessionLocal = async_sessionmaker(
            async_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=engine
        )
        
        # Test connection
        async with async_engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            
        # Enable PostGIS if not already enabled
        async with async_engine.begin() as conn:
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis_topology"))
                logger.info("✅ PostGIS extensions enabled")
            except Exception as e:
                logger.warning(f"PostGIS extension warning: {e}")
        
        logger.info("✅ Database connection established")
        
    except Exception as e:
        logger.warning(f"⚠️ Database connection failed: {e}")
        logger.info("🔧 Running in development mode without database")
        # Continue without database for development


async def close_db():
    """Close database connections"""
    global engine, async_engine
    
    if async_engine:
        await async_engine.dispose()
        logger.info("✅ Async database engine disposed")
    
    if engine:
        engine.dispose()
        logger.info("✅ Sync database engine disposed")


async def get_async_session() -> AsyncSession:
    """Get async database session"""
    if not AsyncSessionLocal:
        raise RuntimeError("Database not initialized")
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            raise
        finally:
            await session.close()


def get_session():
    """Get sync database session"""
    if not SessionLocal:
        raise RuntimeError("Database not initialized")
    
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()


async def check_db_health() -> bool:
    """Check database health"""
    try:
        if not async_engine:
            return False
            
        async with async_engine.begin() as conn:
            result = await conn.execute(text("SELECT 1 as health"))
            return bool(result.fetchone())
            
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


async def get_db_info() -> dict:
    """Get database information"""
    try:
        if not async_engine:
            return {"status": "disconnected"}
            
        async with async_engine.begin() as conn:
            # Get PostgreSQL version
            pg_version = await conn.execute(text("SELECT version()"))
            version = pg_version.fetchone()[0]
            
            # Get PostGIS version
            try:
                postgis_version = await conn.execute(text("SELECT PostGIS_version()"))
                postgis = postgis_version.fetchone()[0]
            except:
                postgis = "Not available"
            
            # Get connection pool info
            pool_info = {
                "pool_size": "N/A",
                "checked_in": "N/A",
                "checked_out": "N/A",
                "overflow": "N/A",
            }
            
            return {
                "status": "connected",
                "postgresql_version": version.split(" ")[1],
                "postgis_version": postgis,
                "pool_info": pool_info,
                "url": settings.DATABASE_URL.split("@")[1] if "@" in settings.DATABASE_URL else "localhost"
            }
            
    except Exception as e:
        logger.error(f"Failed to get database info: {e}")
        return {"status": "error", "error": str(e)}