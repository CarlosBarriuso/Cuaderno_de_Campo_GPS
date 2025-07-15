"""
Sync routes - Offline synchronization for mobile apps
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime
from loguru import logger
from typing import List, Dict, Any

from app.database.connection import get_async_session
from app.models.parcela import Parcela
from app.models.actividad import Actividad
from app.middleware.auth import get_current_user

router = APIRouter()


@router.post("/")
async def sync_data(
    sync_payload: dict,
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Synchronize offline data with server"""
    
    try:
        user_id = current_user["id"]
        results = {
            "success": True,
            "data": {
                "parcelas": {"created": 0, "updated": 0, "conflicts": []},
                "actividades": {"created": 0, "updated": 0, "conflicts": []},
                "server_timestamp": datetime.utcnow().isoformat(),
                "sync_status": "completed"
            }
        }
        
        # Process parcelas
        if "parcelas" in sync_payload:
            parcelas_result = await sync_parcelas(
                db, user_id, sync_payload["parcelas"]
            )
            results["data"]["parcelas"] = parcelas_result
        
        # Process actividades
        if "actividades" in sync_payload:
            actividades_result = await sync_actividades(
                db, user_id, sync_payload["actividades"]
            )
            results["data"]["actividades"] = actividades_result
        
        # Get updated data to send back to client
        updated_data = await get_updated_data_since(
            db, user_id, sync_payload.get("last_sync")
        )
        results["data"]["updated_data"] = updated_data
        
        await db.commit()
        
        logger.info(f"Sync completed for user {user_id}")
        return results
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Sync error for user {user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Sync failed",
                "message": str(e)
            }
        )


@router.get("/pull")
async def pull_server_changes(
    last_sync: str = None,
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Pull server changes since last sync"""
    
    try:
        user_id = current_user["id"]
        
        # Parse last sync timestamp
        last_sync_dt = None
        if last_sync:
            try:
                last_sync_dt = datetime.fromisoformat(last_sync.replace("Z", "+00:00"))
            except ValueError:
                logger.warning(f"Invalid last_sync format: {last_sync}")
        
        # Get updated data
        updated_data = await get_updated_data_since(db, user_id, last_sync_dt)
        
        return {
            "success": True,
            "data": {
                "parcelas": updated_data["parcelas"],
                "actividades": updated_data["actividades"],
                "server_timestamp": datetime.utcnow().isoformat(),
                "last_sync": last_sync
            }
        }
        
    except Exception as e:
        logger.error(f"Pull error for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Error pulling server changes")


@router.post("/push")
async def push_local_changes(
    changes: dict,
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Push local changes to server"""
    
    try:
        user_id = current_user["id"]
        
        # Process the changes
        sync_result = await sync_data(changes, db, current_user)
        
        return {
            "success": True,
            "data": {
                "conflicts": sync_result["data"]["parcelas"]["conflicts"] + 
                           sync_result["data"]["actividades"]["conflicts"],
                "server_timestamp": datetime.utcnow().isoformat(),
                "push_status": "completed"
            }
        }
        
    except Exception as e:
        logger.error(f"Push error for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Error pushing local changes")


@router.get("/status")
async def get_sync_status(current_user: dict = Depends(get_current_user)):
    """Get sync status and server information"""
    
    return {
        "success": True,
        "data": {
            "server_timestamp": datetime.utcnow().isoformat(),
            "user_id": current_user["id"],
            "sync_available": True,
            "last_sync": None,  # Would be stored in user preferences
            "pending_operations": 0,  # Would be calculated from local queue
            "server_version": "2.0.0"
        }
    }


async def sync_parcelas(db: AsyncSession, user_id: str, parcelas_data: List[Dict]) -> Dict:
    """Sync parcelas data"""
    
    result = {"created": 0, "updated": 0, "conflicts": []}
    
    for parcela_data in parcelas_data:
        try:
            parcela_id = parcela_data.get("id")
            
            if parcela_id:
                # Check if exists
                query = select(Parcela).where(
                    Parcela.id == parcela_id,
                    Parcela.propietario_id == user_id
                )
                existing_result = await db.execute(query)
                existing_parcela = existing_result.scalar_one_or_none()
                
                if existing_parcela:
                    # Update existing
                    # Check for conflicts based on updated_at
                    client_updated = datetime.fromisoformat(
                        parcela_data.get("updated_at", "").replace("Z", "+00:00")
                    )
                    
                    if existing_parcela.updated_at > client_updated:
                        # Server is newer - conflict
                        result["conflicts"].append({
                            "type": "parcela",
                            "id": str(parcela_id),
                            "reason": "server_newer",
                            "server_data": existing_parcela.to_dict(),
                            "client_data": parcela_data
                        })
                        continue
                    
                    # Update with client data
                    for field, value in parcela_data.items():
                        if hasattr(existing_parcela, field) and field not in ["id", "created_at"]:
                            setattr(existing_parcela, field, value)
                    
                    result["updated"] += 1
                    
                else:
                    # Create new
                    parcela_data["propietario_id"] = user_id
                    new_parcela = Parcela.from_dict(parcela_data)
                    db.add(new_parcela)
                    result["created"] += 1
            else:
                # Create new without ID
                parcela_data["propietario_id"] = user_id
                new_parcela = Parcela.from_dict(parcela_data)
                db.add(new_parcela)
                result["created"] += 1
                
        except Exception as e:
            logger.error(f"Error syncing parcela: {e}")
            result["conflicts"].append({
                "type": "parcela",
                "id": parcela_data.get("id", "unknown"),
                "reason": "sync_error",
                "error": str(e)
            })
    
    return result


async def sync_actividades(db: AsyncSession, user_id: str, actividades_data: List[Dict]) -> Dict:
    """Sync actividades data"""
    
    result = {"created": 0, "updated": 0, "conflicts": []}
    
    for actividad_data in actividades_data:
        try:
            actividad_id = actividad_data.get("id")
            
            if actividad_id:
                # Check if exists
                query = select(Actividad).where(
                    Actividad.id == actividad_id,
                    Actividad.usuario_id == user_id
                )
                existing_result = await db.execute(query)
                existing_actividad = existing_result.scalar_one_or_none()
                
                if existing_actividad:
                    # Update existing
                    # Check for conflicts
                    client_updated = datetime.fromisoformat(
                        actividad_data.get("updated_at", "").replace("Z", "+00:00")
                    )
                    
                    if existing_actividad.updated_at > client_updated:
                        # Server is newer - conflict
                        result["conflicts"].append({
                            "type": "actividad",
                            "id": str(actividad_id),
                            "reason": "server_newer",
                            "server_data": existing_actividad.to_dict(),
                            "client_data": actividad_data
                        })
                        continue
                    
                    # Update with client data
                    for field, value in actividad_data.items():
                        if hasattr(existing_actividad, field) and field not in ["id", "created_at"]:
                            setattr(existing_actividad, field, value)
                    
                    result["updated"] += 1
                    
                else:
                    # Create new
                    actividad_data["usuario_id"] = user_id
                    new_actividad = Actividad.from_dict(actividad_data)
                    db.add(new_actividad)
                    result["created"] += 1
            else:
                # Create new without ID
                actividad_data["usuario_id"] = user_id
                new_actividad = Actividad.from_dict(actividad_data)
                db.add(new_actividad)
                result["created"] += 1
                
        except Exception as e:
            logger.error(f"Error syncing actividad: {e}")
            result["conflicts"].append({
                "type": "actividad",
                "id": actividad_data.get("id", "unknown"),
                "reason": "sync_error",
                "error": str(e)
            })
    
    return result


async def get_updated_data_since(db: AsyncSession, user_id: str, last_sync: datetime = None) -> Dict:
    """Get data updated since last sync"""
    
    if not last_sync:
        # If no last sync, return all data
        last_sync = datetime.min
    
    # Get updated parcelas
    parcelas_query = select(Parcela).where(
        and_(
            Parcela.propietario_id == user_id,
            Parcela.updated_at > last_sync
        )
    )
    parcelas_result = await db.execute(parcelas_query)
    parcelas = [parcela.to_dict() for parcela in parcelas_result.scalars()]
    
    # Get updated actividades
    actividades_query = select(Actividad).where(
        and_(
            Actividad.usuario_id == user_id,
            Actividad.updated_at > last_sync
        )
    )
    actividades_result = await db.execute(actividades_query)
    actividades = [actividad.to_dict() for actividad in actividades_result.scalars()]
    
    return {
        "parcelas": parcelas,
        "actividades": actividades
    }