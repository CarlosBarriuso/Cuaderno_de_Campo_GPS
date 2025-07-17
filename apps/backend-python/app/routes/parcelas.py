"""
Parcelas routes - Equivalent to Node.js parcelas endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from uuid import UUID
from loguru import logger

from app.database.connection import get_async_session
from app.models.parcela import Parcela, TipoCultivo
from app.middleware.auth import get_current_user

router = APIRouter()


@router.get("/")
async def get_parcelas(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    activa: Optional[bool] = Query(None),
    tipo_cultivo: Optional[TipoCultivo] = Query(None),
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Get user's parcelas with pagination and filters"""
    
    try:
        # Build query
        query = select(Parcela).where(Parcela.propietario_id == current_user["id"])
        
        # Apply filters
        if activa is not None:
            query = query.where(Parcela.activa == activa)
        
        if tipo_cultivo:
            query = query.where(Parcela.tipo_cultivo == tipo_cultivo)
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset(skip).limit(limit).order_by(Parcela.created_at.desc())
        
        # Execute query
        result = await db.execute(query)
        parcelas = result.scalars().all()
        
        # Convert to dict
        parcelas_data = [parcela.to_dict() for parcela in parcelas]
        
        return {
            "success": True,
            "data": parcelas_data,
            "pagination": {
                "total": total,
                "page": (skip // limit) + 1,
                "limit": limit,
                "total_pages": (total + limit - 1) // limit
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting parcelas: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving parcelas")


@router.get("/{parcela_id}")
async def get_parcela(
    parcela_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Get specific parcela by ID"""
    
    try:
        query = select(Parcela).where(
            Parcela.id == parcela_id,
            Parcela.propietario_id == current_user["id"]
        )
        
        result = await db.execute(query)
        parcela = result.scalar_one_or_none()
        
        if not parcela:
            raise HTTPException(status_code=404, detail="Parcela not found")
        
        return {
            "success": True,
            "data": parcela.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting parcela {parcela_id}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving parcela")


@router.post("/")
async def create_parcela(
    parcela_data: dict,
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Create new parcela"""
    
    try:
        # Add owner information
        parcela_data["propietario_id"] = current_user["id"]
        
        # Create parcela instance
        parcela = Parcela.from_dict(parcela_data)
        
        # Add to database
        db.add(parcela)
        await db.commit()
        await db.refresh(parcela)
        
        logger.info(f"Created parcela {parcela.id} for user {current_user['id']}")
        
        return {
            "success": True,
            "data": parcela.to_dict(),
            "message": "Parcela created successfully"
        }
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating parcela: {e}")
        raise HTTPException(status_code=500, detail="Error creating parcela")


@router.put("/{parcela_id}")
async def update_parcela(
    parcela_id: UUID,
    parcela_data: dict,
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Update existing parcela"""
    
    try:
        # Find parcela
        query = select(Parcela).where(
            Parcela.id == parcela_id,
            Parcela.propietario_id == current_user["id"]
        )
        
        result = await db.execute(query)
        parcela = result.scalar_one_or_none()
        
        if not parcela:
            raise HTTPException(status_code=404, detail="Parcela not found")
        
        # Update fields
        for field, value in parcela_data.items():
            if hasattr(parcela, field) and field != "id":
                if field == "tipo_cultivo" and value:
                    setattr(parcela, field, TipoCultivo(value))
                else:
                    setattr(parcela, field, value)
        
        await db.commit()
        await db.refresh(parcela)
        
        logger.info(f"Updated parcela {parcela_id} for user {current_user['id']}")
        
        return {
            "success": True,
            "data": parcela.to_dict(),
            "message": "Parcela updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating parcela {parcela_id}: {e}")
        raise HTTPException(status_code=500, detail="Error updating parcela")


@router.delete("/{parcela_id}")
async def delete_parcela(
    parcela_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Delete parcela (soft delete by setting activa=False)"""
    
    try:
        # Find parcela
        query = select(Parcela).where(
            Parcela.id == parcela_id,
            Parcela.propietario_id == current_user["id"]
        )
        
        result = await db.execute(query)
        parcela = result.scalar_one_or_none()
        
        if not parcela:
            raise HTTPException(status_code=404, detail="Parcela not found")
        
        # Soft delete
        parcela.activa = False
        await db.commit()
        
        logger.info(f"Deleted parcela {parcela_id} for user {current_user['id']}")
        
        return {
            "success": True,
            "message": "Parcela deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting parcela {parcela_id}: {e}")
        raise HTTPException(status_code=500, detail="Error deleting parcela")


@router.get("/{parcela_id}/superficie")
async def calculate_superficie(
    parcela_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Calculate superficie from geometry using PostGIS"""
    
    try:
        # Find parcela
        query = select(Parcela).where(
            Parcela.id == parcela_id,
            Parcela.propietario_id == current_user["id"]
        )
        
        result = await db.execute(query)
        parcela = result.scalar_one_or_none()
        
        if not parcela:
            raise HTTPException(status_code=404, detail="Parcela not found")
        
        if not parcela.geometria:
            raise HTTPException(status_code=400, detail="Parcela has no geometry")
        
        # Calculate area using PostGIS
        from sqlalchemy import text
        area_query = text("""
            SELECT ST_Area(ST_Transform(geometria, 3857)) / 10000 as area_hectares
            FROM parcelas 
            WHERE id = :parcela_id
        """)
        
        area_result = await db.execute(area_query, {"parcela_id": parcela_id})
        area_hectares = area_result.scalar()
        
        return {
            "success": True,
            "data": {
                "parcela_id": str(parcela_id),
                "superficie_calculada": round(area_hectares, 4),
                "superficie_registrada": parcela.superficie,
                "unidad": "hectáreas"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating superficie for parcela {parcela_id}: {e}")
        raise HTTPException(status_code=500, detail="Error calculating superficie")


@router.post("/find-by-location")
async def find_parcela_by_location(
    location_data: dict,
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Find parcela by GPS coordinates using PostGIS spatial queries"""
    
    try:
        # Validate required fields
        if not all(key in location_data for key in ['latitude', 'longitude']):
            raise HTTPException(status_code=400, detail="Latitude and longitude are required")
        
        lat = float(location_data['latitude'])
        lng = float(location_data['longitude'])
        
        # Validate coordinate ranges
        if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
            raise HTTPException(status_code=400, detail="Invalid GPS coordinates")
        
        # Use PostGIS to find parcela containing the point
        from sqlalchemy import text
        
        query = text("""
            SELECT 
                id,
                nombre,
                superficie,
                tipo_cultivo,
                cultivo,
                ST_Distance(
                    ST_Transform(geometria, 3857),
                    ST_Transform(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), 3857)
                ) as distance_meters,
                ST_Contains(geometria, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) as within_parcela
            FROM parcelas 
            WHERE propietario_id = :user_id 
                AND activa = true
                AND geometria IS NOT NULL
            ORDER BY 
                ST_Contains(geometria, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) DESC,
                ST_Distance(
                    ST_Transform(geometria, 3857),
                    ST_Transform(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), 3857)
                ) ASC
            LIMIT 5
        """)
        
        result = await db.execute(query, {
            "lat": lat,
            "lng": lng,
            "user_id": current_user["id"]
        })
        
        parcelas_found = result.fetchall()
        
        if not parcelas_found:
            return {
                "success": True,
                "data": {
                    "parcela_found": None,
                    "nearest_parcelas": [],
                    "coordinates": {"latitude": lat, "longitude": lng},
                    "message": "No hay parcelas registradas cerca de esta ubicación"
                }
            }
        
        # Convert results to dictionaries
        parcelas_list = []
        exact_match = None
        
        for row in parcelas_found:
            parcela_data = {
                "id": str(row.id),
                "nombre": row.nombre,
                "superficie": float(row.superficie),
                "tipo_cultivo": row.tipo_cultivo,
                "cultivo": row.cultivo,
                "distance_meters": float(row.distance_meters) if row.distance_meters else 0,
                "within_parcela": bool(row.within_parcela)
            }
            
            parcelas_list.append(parcela_data)
            
            # If GPS point is within parcela boundaries
            if row.within_parcela:
                exact_match = parcela_data
        
        logger.info(f"GPS location check: Found {len(parcelas_list)} parcelas for user {current_user['id']} at ({lat}, {lng})")
        
        return {
            "success": True,
            "data": {
                "parcela_found": exact_match,
                "nearest_parcelas": parcelas_list,
                "coordinates": {"latitude": lat, "longitude": lng},
                "message": "Ubicación encontrada dentro de parcela" if exact_match else f"Ubicación cercana a {len(parcelas_list)} parcela(s)"
            }
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid coordinate format")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding parcela by location: {e}")
        raise HTTPException(status_code=500, detail="Error processing location data")