"""
Actividades routes - Equivalent to Node.js actividades endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from loguru import logger

from app.database.connection import get_async_session
from app.models.actividad import Actividad, TipoActividad, EstadoActividad
from app.middleware.auth import get_current_user

router = APIRouter()


@router.get("/")
async def get_actividades(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    parcela_id: Optional[UUID] = Query(None),
    tipo: Optional[TipoActividad] = Query(None),
    estado: Optional[EstadoActividad] = Query(None),
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Get user's actividades with pagination and filters"""
    
    try:
        # Build query
        query = select(Actividad).where(Actividad.usuario_id == current_user["id"])
        
        # Apply filters
        if parcela_id:
            query = query.where(Actividad.parcela_id == parcela_id)
        
        if tipo:
            query = query.where(Actividad.tipo == tipo)
            
        if estado:
            query = query.where(Actividad.estado == estado)
            
        if fecha_desde:
            query = query.where(Actividad.fecha >= fecha_desde)
            
        if fecha_hasta:
            query = query.where(Actividad.fecha <= fecha_hasta)
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination and ordering
        query = query.offset(skip).limit(limit).order_by(Actividad.fecha.desc())
        
        # Execute query
        result = await db.execute(query)
        actividades = result.scalars().all()
        
        # Convert to dict
        actividades_data = [actividad.to_dict() for actividad in actividades]
        
        return {
            "success": True,
            "data": actividades_data,
            "pagination": {
                "total": total,
                "page": (skip // limit) + 1,
                "limit": limit,
                "total_pages": (total + limit - 1) // limit
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting actividades: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving actividades")


@router.get("/{actividad_id}")
async def get_actividad(
    actividad_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Get specific actividad by ID"""
    
    try:
        query = select(Actividad).where(
            Actividad.id == actividad_id,
            Actividad.usuario_id == current_user["id"]
        )
        
        result = await db.execute(query)
        actividad = result.scalar_one_or_none()
        
        if not actividad:
            raise HTTPException(status_code=404, detail="Actividad not found")
        
        return {
            "success": True,
            "data": actividad.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting actividad {actividad_id}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving actividad")


@router.post("/")
async def create_actividad(
    actividad_data: dict,
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Create new actividad"""
    
    try:
        # Add user information
        actividad_data["usuario_id"] = current_user["id"]
        
        # Parse fecha if it's a string
        if isinstance(actividad_data.get("fecha"), str):
            actividad_data["fecha"] = datetime.fromisoformat(actividad_data["fecha"].replace("Z", "+00:00"))
        
        # Create actividad instance
        actividad = Actividad.from_dict(actividad_data)
        
        # Calculate total cost if individual costs are provided
        if not actividad.costo_total:
            total = 0
            if actividad.costo_mano_obra:
                total += actividad.costo_mano_obra
            if actividad.costo_productos:
                total += actividad.costo_productos
            if actividad.costo_maquinaria:
                total += actividad.costo_maquinaria
            actividad.costo_total = total if total > 0 else None
        
        # Add to database
        db.add(actividad)
        await db.commit()
        await db.refresh(actividad)
        
        logger.info(f"Created actividad {actividad.id} for user {current_user['id']}")
        
        return {
            "success": True,
            "data": actividad.to_dict(),
            "message": "Actividad created successfully"
        }
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating actividad: {e}")
        raise HTTPException(status_code=500, detail="Error creating actividad")


@router.put("/{actividad_id}")
async def update_actividad(
    actividad_id: UUID,
    actividad_data: dict,
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Update existing actividad"""
    
    try:
        # Find actividad
        query = select(Actividad).where(
            Actividad.id == actividad_id,
            Actividad.usuario_id == current_user["id"]
        )
        
        result = await db.execute(query)
        actividad = result.scalar_one_or_none()
        
        if not actividad:
            raise HTTPException(status_code=404, detail="Actividad not found")
        
        # Update fields
        for field, value in actividad_data.items():
            if hasattr(actividad, field) and field != "id":
                if field == "tipo" and value:
                    setattr(actividad, field, TipoActividad(value))
                elif field == "estado" and value:
                    setattr(actividad, field, EstadoActividad(value))
                elif field == "fecha" and isinstance(value, str):
                    setattr(actividad, field, datetime.fromisoformat(value.replace("Z", "+00:00")))
                else:
                    setattr(actividad, field, value)
        
        # Recalculate total cost
        if any(field in actividad_data for field in ["costo_mano_obra", "costo_productos", "costo_maquinaria"]):
            total = 0
            if actividad.costo_mano_obra:
                total += actividad.costo_mano_obra
            if actividad.costo_productos:
                total += actividad.costo_productos
            if actividad.costo_maquinaria:
                total += actividad.costo_maquinaria
            actividad.costo_total = total if total > 0 else None
        
        await db.commit()
        await db.refresh(actividad)
        
        logger.info(f"Updated actividad {actividad_id} for user {current_user['id']}")
        
        return {
            "success": True,
            "data": actividad.to_dict(),
            "message": "Actividad updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating actividad {actividad_id}: {e}")
        raise HTTPException(status_code=500, detail="Error updating actividad")


@router.delete("/{actividad_id}")
async def delete_actividad(
    actividad_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Delete actividad permanently"""
    
    try:
        # Find actividad
        query = select(Actividad).where(
            Actividad.id == actividad_id,
            Actividad.usuario_id == current_user["id"]
        )
        
        result = await db.execute(query)
        actividad = result.scalar_one_or_none()
        
        if not actividad:
            raise HTTPException(status_code=404, detail="Actividad not found")
        
        # Delete permanently
        await db.delete(actividad)
        await db.commit()
        
        logger.info(f"Deleted actividad {actividad_id} for user {current_user['id']}")
        
        return {
            "success": True,
            "message": "Actividad deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting actividad {actividad_id}: {e}")
        raise HTTPException(status_code=500, detail="Error deleting actividad")


@router.get("/stats/resumen")
async def get_actividades_stats(
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Get actividades statistics summary"""
    
    try:
        # Build base query
        query = select(Actividad).where(Actividad.usuario_id == current_user["id"])
        
        # Apply date filters
        if fecha_desde:
            query = query.where(Actividad.fecha >= fecha_desde)
        if fecha_hasta:
            query = query.where(Actividad.fecha <= fecha_hasta)
        
        # Get all actividades
        result = await db.execute(query)
        actividades = result.scalars().all()
        
        # Calculate statistics
        total_actividades = len(actividades)
        total_costo = sum(a.costo_total or 0 for a in actividades)
        total_horas = sum(a.duracion_horas or 0 for a in actividades)
        
        # Group by type
        por_tipo = {}
        for actividad in actividades:
            tipo = actividad.tipo.value
            if tipo not in por_tipo:
                por_tipo[tipo] = {"count": 0, "costo": 0, "horas": 0}
            por_tipo[tipo]["count"] += 1
            por_tipo[tipo]["costo"] += actividad.costo_total or 0
            por_tipo[tipo]["horas"] += actividad.duracion_horas or 0
        
        # Group by status
        por_estado = {}
        for actividad in actividades:
            estado = actividad.estado.value
            if estado not in por_estado:
                por_estado[estado] = 0
            por_estado[estado] += 1
        
        return {
            "success": True,
            "data": {
                "resumen": {
                    "total_actividades": total_actividades,
                    "total_costo": round(total_costo, 2),
                    "total_horas": round(total_horas, 2),
                    "costo_promedio": round(total_costo / total_actividades, 2) if total_actividades > 0 else 0
                },
                "por_tipo": por_tipo,
                "por_estado": por_estado,
                "periodo": {
                    "desde": fecha_desde.isoformat() if fecha_desde else None,
                    "hasta": fecha_hasta.isoformat() if fecha_hasta else None
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting actividades stats: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving statistics")