"""
Initialize database with tables
"""
import asyncio
from app.database import connection
from app.models.parcela import Parcela
from app.models.actividad import Actividad
from loguru import logger

async def init_database():
    """Initialize database with all tables"""
    try:
        logger.info("Initializing database connection...")
        await connection.init_db()
        
        logger.info("Creating database tables...")
        
        # Create all tables
        async with connection.async_engine.begin() as conn:
            await conn.run_sync(connection.Base.metadata.create_all)
            
        logger.success("Database tables created successfully!")
        
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(init_database())