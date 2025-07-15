"""
User routes - User profile and statistics
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from loguru import logger
from datetime import datetime, timedelta

from app.database.connection import get_async_session
from app.models.parcela import Parcela
from app.models.actividad import Actividad
from app.middleware.auth import get_current_user

router = APIRouter()


@router.get("/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile information"""
    
    return {
        "success": True,
        "data": {
            "id": current_user["id"],
            "email": current_user["email"],
            "first_name": current_user["first_name"],
            "last_name": current_user["last_name"],
            "clerk_id": current_user["clerk_id"],
            "created_at": datetime.utcnow().isoformat(),
            "profile_complete": True
        }
    }


@router.get("/stats")
async def get_user_stats(
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Get user statistics dashboard"""
    
    try:
        user_id = current_user["id"]
        
        # Get parcelas count and total superficie
        parcelas_query = select(
            func.count(Parcela.id).label("total_parcelas"),
            func.coalesce(func.sum(Parcela.superficie), 0).label("superficie_total")
        ).where(
            Parcela.propietario_id == user_id,
            Parcela.activa == True
        )
        
        parcelas_result = await db.execute(parcelas_query)
        parcelas_stats = parcelas_result.first()
        
        # Get actividades count this month
        current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        actividades_query = select(
            func.count(Actividad.id).label("actividades_mes"),
            func.coalesce(func.sum(Actividad.costo_total), 0).label("costo_total_mes")
        ).where(
            Actividad.usuario_id == user_id,
            Actividad.fecha >= current_month_start
        )
        
        actividades_result = await db.execute(actividades_query)
        actividades_stats = actividades_result.first()
        
        # Get actividades by type
        actividades_tipo_query = select(
            Actividad.tipo,
            func.count(Actividad.id).label("count")
        ).where(
            Actividad.usuario_id == user_id,
            Actividad.fecha >= current_month_start
        ).group_by(Actividad.tipo)
        
        actividades_tipo_result = await db.execute(actividades_tipo_query)
        actividades_por_tipo = {row.tipo.value: row.count for row in actividades_tipo_result}
        
        # Get recent actividades
        recent_actividades_query = select(Actividad).where(
            Actividad.usuario_id == user_id
        ).order_by(Actividad.fecha.desc()).limit(5)
        
        recent_result = await db.execute(recent_actividades_query)
        recent_actividades = [actividad.to_dict() for actividad in recent_result.scalars()]
        
        # Calculate productivity metrics
        productivity = await calculate_productivity_metrics(db, user_id)
        
        stats = {
            "resumen": {
                "total_parcelas": parcelas_stats.total_parcelas,
                "superficie_total": float(parcelas_stats.superficie_total),
                "actividades_este_mes": actividades_stats.actividades_mes,
                "costo_total_mes": float(actividades_stats.costo_total_mes)
            },
            "actividades_por_tipo": actividades_por_tipo,
            "actividades_recientes": recent_actividades,
            "productividad": productivity,
            "periodo": {
                "mes_actual": current_month_start.strftime("%Y-%m"),
                "generado_en": datetime.utcnow().isoformat()
            }
        }
        
        return {
            "success": True,
            "data": stats
        }
        
    except Exception as e:
        logger.error(f"Error getting user stats for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving user statistics")


@router.get("/dashboard")
async def get_dashboard_data(
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive dashboard data"""
    
    try:
        user_id = current_user["id"]
        
        # Get basic stats
        stats_response = await get_user_stats(db, current_user)
        stats = stats_response["data"]
        
        # Get upcoming activities (planned activities)
        upcoming_query = select(Actividad).where(
            Actividad.usuario_id == user_id,
            Actividad.estado == "PLANIFICADA",
            Actividad.fecha >= datetime.utcnow()
        ).order_by(Actividad.fecha.asc()).limit(10)
        
        upcoming_result = await db.execute(upcoming_query)
        upcoming_activities = [actividad.to_dict() for actividad in upcoming_result.scalars()]
        
        # Get weather alerts (mock data)
        weather_alerts = [
            {
                "type": "lluvia",
                "severity": "medium", 
                "message": "Lluvia prevista para mañana - revisar aplicaciones",
                "date": (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")
            }
        ]
        
        # Get parcelas summary
        parcelas_query = select(Parcela).where(
            Parcela.propietario_id == user_id,
            Parcela.activa == True
        ).limit(5)
        
        parcelas_result = await db.execute(parcelas_query)
        parcelas_summary = [parcela.to_dict() for parcela in parcelas_result.scalars()]
        
        dashboard = {
            "usuario": {
                "nombre": f"{current_user['first_name']} {current_user['last_name']}",
                "email": current_user["email"]
            },
            "estadisticas": stats["resumen"],
            "actividades_proximas": upcoming_activities,
            "alertas_meteorologicas": weather_alerts,
            "parcelas_resumen": parcelas_summary,
            "productividad": stats["productividad"],
            "ultima_actualizacion": datetime.utcnow().isoformat()
        }
        
        return {
            "success": True,
            "data": dashboard
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard data for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving dashboard data")


@router.put("/profile")
async def update_user_profile(
    profile_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile information"""
    
    try:
        # For now, just return the updated profile
        # In a real implementation, this would update Clerk user data
        
        updated_profile = {
            "id": current_user["id"],
            "email": current_user["email"],
            "first_name": profile_data.get("first_name", current_user["first_name"]),
            "last_name": profile_data.get("last_name", current_user["last_name"]),
            "clerk_id": current_user["clerk_id"],
            "updated_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Updated profile for user {current_user['id']}")
        
        return {
            "success": True,
            "data": updated_profile,
            "message": "Profile updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error updating profile for {current_user['id']}: {e}")
        raise HTTPException(status_code=500, detail="Error updating profile")


async def calculate_productivity_metrics(db: AsyncSession, user_id: str) -> dict:
    """Calculate productivity metrics for user"""
    
    try:
        # Time period for analysis
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Activities completed in last 30 days
        completed_query = select(func.count(Actividad.id)).where(
            Actividad.usuario_id == user_id,
            Actividad.estado == "COMPLETADA",
            Actividad.fecha >= thirty_days_ago
        )
        
        completed_result = await db.execute(completed_query)
        completed_activities = completed_result.scalar()
        
        # Total planned activities
        planned_query = select(func.count(Actividad.id)).where(
            Actividad.usuario_id == user_id,
            Actividad.fecha >= thirty_days_ago
        )
        
        planned_result = await db.execute(planned_query)
        total_activities = planned_result.scalar()
        
        # Calculate completion rate
        completion_rate = (completed_activities / total_activities * 100) if total_activities > 0 else 0
        
        # Average cost per activity
        cost_query = select(func.avg(Actividad.costo_total)).where(
            Actividad.usuario_id == user_id,
            Actividad.costo_total.isnot(None),
            Actividad.fecha >= thirty_days_ago
        )
        
        cost_result = await db.execute(cost_query)
        avg_cost = cost_result.scalar() or 0
        
        # Activities per hectare
        superficie_query = select(func.sum(Parcela.superficie)).where(
            Parcela.propietario_id == user_id,
            Parcela.activa == True
        )
        
        superficie_result = await db.execute(superficie_query)
        total_superficie = superficie_result.scalar() or 1
        
        activities_per_hectare = completed_activities / total_superficie
        
        return {
            "tasa_completacion": round(completion_rate, 1),
            "actividades_completadas_30d": completed_activities,
            "costo_promedio_actividad": round(float(avg_cost), 2),
            "actividades_por_hectarea": round(activities_per_hectare, 2),
            "eficiencia_general": "alta" if completion_rate > 80 else "media" if completion_rate > 60 else "baja"
        }
        
    except Exception as e:
        logger.error(f"Error calculating productivity metrics: {e}")
        return {
            "tasa_completacion": 0,
            "actividades_completadas_30d": 0,
            "costo_promedio_actividad": 0,
            "actividades_por_hectarea": 0,
            "eficiencia_general": "sin_datos"
        }