"""
Parcelas routes - Equivalent to Node.js parcelas endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from loguru import logger

from app.database.connection import get_async_session
from app.models.parcela import Parcela, TipoCultivo
from app.middleware.auth import get_current_user
from app.services.sigpac_real import sigpac_service

router = APIRouter()


async def _enrich_with_sigpac_data(parcela_data: dict):
    """Enriquecer datos de parcela con información real de SIGPAC"""
    try:
        # Buscar referencia catastral en diferentes campos
        referencia_catastral = None
        
        # Verificar diferentes campos donde podría estar la referencia
        for field in ['referencia_sigpac', 'referenciasCatastrales', 'referencias_catastrales', 'referencia_catastral']:
            if field in parcela_data and parcela_data[field]:
                referencia_catastral = parcela_data[field]
                break
        
        if not referencia_catastral:
            logger.info("No se encontró referencia catastral, usando datos del formulario")
            return
            
        logger.info(f"🔍 Obteniendo datos reales de SIGPAC para: {referencia_catastral}")
        
        # Consultar datos reales de SIGPAC
        sigpac_response = await sigpac_service.get_parcela_data(referencia_catastral)
        
        if sigpac_response.get('success') and sigpac_response.get('data'):
            sigpac_data = sigpac_response['data']
            
            # Actualizar coordenadas con datos reales del catastro
            if sigpac_data.get('coordenadas_centroide'):
                coords = sigpac_data['coordenadas_centroide']
                parcela_data['coordenadas'] = {
                    'latitud': coords['lat'],
                    'longitud': coords['lng']
                }
                logger.info(f"✅ Coordenadas actualizadas: {coords['lat']}, {coords['lng']}")
            
            # Actualizar superficie si está disponible
            if sigpac_data.get('superficie') and sigpac_data['superficie'] > 0:
                parcela_data['superficie'] = sigpac_data['superficie']
                logger.info(f"✅ Superficie actualizada: {sigpac_data['superficie']} ha")
            
            # Actualizar geometría si está disponible
            if sigpac_data.get('geometria'):
                parcela_data['geometria_sigpac'] = sigpac_data['geometria']
                logger.info(f"✅ Geometría SIGPAC actualizada")
            
            # Actualizar uso del suelo
            if sigpac_data.get('uso_sigpac'):
                parcela_data['uso_sigpac'] = sigpac_data['uso_sigpac']
            
            # Actualizar cultivo si no se especificó
            if sigpac_data.get('cultivo') and not parcela_data.get('cultivo'):
                parcela_data['cultivo'] = sigpac_data['cultivo']
                
        else:
            logger.warning(f"No se pudieron obtener datos de SIGPAC para: {referencia_catastral}")
            
    except Exception as e:
        logger.error(f"Error enriqueciendo datos con SIGPAC: {e}")
        # No fallar la creación si SIGPAC falla, continuar con datos del formulario


@router.get("/test")
async def test_parcelas_no_auth(
    db: AsyncSession = Depends(get_async_session)
):
    """Test endpoint without auth to debug encoding issues"""
    try:
        query = select(Parcela).where(Parcela.activa == True).limit(1)
        result = await db.execute(query)
        parcela = result.scalar_one_or_none()
        
        if parcela:
            return {
                "success": True,
                "debug": {
                    "id": str(parcela.id),
                    "nombre": parcela.nombre,
                    "superficie": float(parcela.superficie)
                }
            }
        else:
            return {"success": True, "debug": "no_parcelas"}
    except Exception as e:
        logger.error(f"Test endpoint error: {e}")
        return {"success": False, "error": str(e)}


@router.get("/")
async def get_parcelas(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    activa: Optional[bool] = Query(True),  # Default to True to only show active parcelas
    tipo_cultivo: Optional[TipoCultivo] = Query(None),
    include_deleted: bool = Query(False),  # Add explicit parameter to include deleted parcelas
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Get user's parcelas with pagination and filters"""
    
    try:
        # Build query
        query = select(Parcela).where(Parcela.propietario_id == current_user["id"])
        
        # Apply filters - by default only show active parcelas unless explicitly requested
        if include_deleted:
            # If include_deleted is True, show all parcelas regardless of activa status
            if activa is not None:
                query = query.where(Parcela.activa == activa)
        else:
            # Default behavior: only show active parcelas
            query = query.where(Parcela.activa == True)
        
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


@router.get("/map-data")
async def get_map_data(
    cultivos: Optional[List[str]] = Query(None),
    tipos_actividad: Optional[List[str]] = Query(None),
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    solo_con_actividad: bool = Query(False),
    db: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(get_current_user)
):
    """Get enriched parcelas data for map visualization with GeoJSON geometries"""
    
    try:
        from app.models.actividad import Actividad
        from sqlalchemy import text
        import json
        
        logger.info(f"🗺️ Loading map data for user: {current_user}")
        logger.info(f"🔍 User ID for query: {current_user['id']}")
        
        # First, let's check if there are any parcelas at all for debugging
        debug_query = text("SELECT COUNT(*) as total FROM parcelas WHERE activa = true")
        debug_result = await db.execute(debug_query)
        total_parcelas = debug_result.scalar()
        logger.info(f"🔍 Total active parcelas in database: {total_parcelas}")
        
        debug_user_query = text("SELECT COUNT(*) as total FROM parcelas WHERE propietario_id = :user_id AND activa = true")
        debug_user_result = await db.execute(debug_user_query, {"user_id": current_user["id"]})
        user_parcelas = debug_user_result.scalar()
        logger.info(f"🔍 Parcelas for user {current_user['id']}: {user_parcelas}")
        
        # Query with GeoJSON conversion
        map_query = text("""
            SELECT 
                p.id,
                p.nombre,
                p.superficie,
                p.tipo_cultivo,
                p.cultivo,
                p.variedad,
                p.activa,
                p.referencia_sigpac,
                p.referencias_catastrales,
                ST_AsGeoJSON(p.geometria) as geometria_geojson,
                ST_X(p.centroide) as centroide_lng,
                ST_Y(p.centroide) as centroide_lat,
                p.created_at,
                p.updated_at
            FROM parcelas p
            WHERE p.propietario_id = :user_id 
            AND p.activa = true
        """)
        
        result = await db.execute(map_query, {"user_id": current_user["id"]})
        parcelas_raw = result.fetchall()
        
        logger.info(f"📊 Found {len(parcelas_raw)} parcelas for user {current_user['id']}")
        
        # Build response data
        parcelas_data = []
        
        for row in parcelas_raw:
            logger.info(f"🌾 Processing parcela: {row.nombre}")
            
            # Parse GeoJSON geometry
            geometria_geojson = None
            if row.geometria_geojson:
                try:
                    geometria_geojson = json.loads(row.geometria_geojson)
                    logger.info(f"✅ GeoJSON parsed for {row.nombre}")
                except Exception as e:
                    logger.error(f"Error parsing GeoJSON for parcela {row.nombre}: {e}")
            else:
                logger.warning(f"⚠️ No geometry data for parcela {row.nombre}")
            
            # Build centroide coordinates
            centroide = None
            if row.centroide_lng is not None and row.centroide_lat is not None:
                centroide = {
                    "lat": float(row.centroide_lat),
                    "lng": float(row.centroide_lng)
                }
                logger.info(f"📍 Centroide for {row.nombre}: {centroide}")
            else:
                logger.warning(f"⚠️ No centroide data for parcela {row.nombre}")
            
            # Get last activity for this parcela
            activity_query = select(Actividad).where(
                Actividad.parcela_id == row.id,
                Actividad.usuario_id == current_user["id"]
            ).order_by(Actividad.fecha.desc()).limit(1)
            
            # Apply activity filters
            if tipos_actividad:
                activity_query = activity_query.where(Actividad.tipo.in_(tipos_actividad))
            
            if fecha_desde:
                activity_query = activity_query.where(Actividad.fecha >= fecha_desde)
                
            if fecha_hasta:
                activity_query = activity_query.where(Actividad.fecha <= fecha_hasta)
            
            activity_result = await db.execute(activity_query)
            ultima_actividad = activity_result.scalar_one_or_none()
            
            # Skip parcela if solo_con_actividad is True and no activity found
            if solo_con_actividad and not ultima_actividad:
                continue
            
            # Build parcela data from row
            parcela_dict = {
                "id": str(row.id),
                "nombre": row.nombre,
                "superficie": row.superficie,
                "tipo_cultivo": row.tipo_cultivo,
                "cultivo": row.cultivo,
                "variedad": row.variedad,
                "activa": row.activa,
                "referencia_sigpac": row.referencia_sigpac,
                "referencias_catastrales": row.referencias_catastrales,
                "geometria_geojson": geometria_geojson,
                "centroide": centroide,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None
            }
            
            if ultima_actividad:
                if ultima_actividad.fecha:
                    # Ensure both are date objects for proper subtraction
                    fecha_actividad = ultima_actividad.fecha.date() if hasattr(ultima_actividad.fecha, 'date') else ultima_actividad.fecha
                    dias_desde = (datetime.now().date() - fecha_actividad).days
                else:
                    dias_desde = None
                parcela_dict.update({
                    'ultima_actividad': {
                        'id': str(ultima_actividad.id),
                        'tipo': ultima_actividad.tipo.value,
                        'nombre': ultima_actividad.nombre,
                        'fecha': ultima_actividad.fecha.isoformat() if ultima_actividad.fecha else None,
                        'dias_desde': dias_desde,
                        'estado': ultima_actividad.estado.value if ultima_actividad.estado else None
                    }
                })
            else:
                parcela_dict['ultima_actividad'] = None
            
            parcelas_data.append(parcela_dict)
        
        # Calculate statistics
        total_parcelas = len(parcelas_data)
        total_superficie = sum(p.get('superficie', 0) or 0 for p in parcelas_data)
        
        # Group by cultivo
        cultivos_stats = {}
        for parcela in parcelas_data:
            cultivo = parcela.get('tipo_cultivo')
            if cultivo not in cultivos_stats:
                cultivos_stats[cultivo] = {'count': 0, 'superficie': 0}
            cultivos_stats[cultivo]['count'] += 1
            cultivos_stats[cultivo]['superficie'] += parcela.get('superficie', 0) or 0
        
        # Group by last activity type
        actividades_stats = {}
        for parcela in parcelas_data:
            if parcela.get('ultima_actividad'):
                tipo = parcela['ultima_actividad']['tipo']
                if tipo not in actividades_stats:
                    actividades_stats[tipo] = 0
                actividades_stats[tipo] += 1
        
        response = {
            "success": True,
            "data": parcelas_data,
            "statistics": {
                "total_parcelas": total_parcelas,
                "total_superficie": round(total_superficie, 2),
                "por_cultivo": cultivos_stats,
                "por_ultima_actividad": actividades_stats
            }
        }
        
        logger.info(f"🚀 Returning response with {len(parcelas_data)} parcelas")
        logger.info(f"📋 Response structure: {list(response.keys())}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error getting map data: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Error retrieving map data")


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


@router.post("/test-create")
async def test_create_parcela(
    parcela_data: dict,
    db: AsyncSession = Depends(get_async_session)
):
    """Test endpoint to create parcela without auth"""
    
    try:
        # Use a test user ID
        parcela_data["propietario_id"] = "test-user-gustavo"
        
        # Enriquecer con datos reales de SIGPAC
        await _enrich_with_sigpac_data(parcela_data)
        
        # Create parcela instance
        parcela = Parcela.from_dict(parcela_data)
        
        # Add to database
        db.add(parcela)
        await db.commit()
        await db.refresh(parcela)
        
        logger.info(f"Test created parcela {parcela.id} for test user")
        
        return {
            "success": True,
            "data": parcela.to_dict(),
            "message": "Test parcela created successfully"
        }
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating test parcela: {e}")
        return {"success": False, "error": str(e)}


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
        
        # Log incoming data for debugging
        logger.info(f"Creating parcela with data: {parcela_data}")
        
        # Si hay referencia catastral, obtener coordenadas reales del SIGPAC
        await _enrich_with_sigpac_data(parcela_data)
        
        # Create parcela instance
        parcela = Parcela.from_dict(parcela_data)
        logger.info(f"Parcela instance created successfully")
        
        # Add to database
        db.add(parcela)
        logger.info(f"Parcela added to session")
        await db.commit()
        logger.info(f"Database commit successful")
        await db.refresh(parcela)
        logger.info(f"Parcela refreshed")
        
        logger.info(f"Created parcela {parcela.id} for user {current_user['id']}")
        
        return {
            "success": True,
            "data": parcela.to_dict(),
            "message": "Parcela created successfully"
        }
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating parcela: {e}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error details: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error creating parcela: {str(e)}")


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