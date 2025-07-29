"""
SIGPAC routes - Sistema de Información Geográfica de Parcelas Agrícolas
REAL IMPLEMENTATION using official WFS/WMS services
"""

from fastapi import APIRouter, HTTPException, Query, Depends
import httpx
import re
from loguru import logger
from typing import Optional
from app.services.sigpac_real import sigpac_service
from app.middleware.auth import get_current_user

router = APIRouter()


@router.get("/parcela/{referencia}")
async def get_parcela_sigpac(
    referencia: str,
    current_user: dict = Depends(get_current_user)
):
    """Get SIGPAC parcela information by reference - REAL DATA from official services"""
    
    try:
        # Validate SIGPAC reference format
        if not validate_sigpac_reference(referencia):
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": "Invalid SIGPAC reference format",
                    "message": "Reference must follow format PP:MMM:AAAA:ZZZZZ:PPPP:RR or PPMMMAAAAAZZZZZPPPPRRR"
                }
            )
        
        # Query real SIGPAC data using WFS/WMS and Catastro
        logger.info(f"🔍 Querying REAL SIGPAC data for: {referencia}")
        result = await sigpac_service.get_parcela_data(referencia)
        
        logger.info(f"✅ Real SIGPAC data retrieved for: {referencia}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error retrieving real SIGPAC data for {referencia}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "SIGPAC service error", 
                "message": f"Could not retrieve parcela information: {str(e)}"
            }
        )


@router.get("/buscar")
async def search_sigpac(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radio: Optional[int] = Query(1000, description="Search radius in meters")
):
    """Search SIGPAC parcelas by coordinates"""
    
    try:
        # Validate coordinates
        if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": "Invalid coordinates",
                    "message": "Latitude must be between -90 and 90, longitude between -180 and 180"
                }
            )
        
        # Mock search results
        # TODO: Implement real SIGPAC WMS search
        mock_results = {
            "success": True,
            "data": {
                "coordenadas": {"lat": lat, "lng": lng},
                "radio_metros": radio,
                "parcelas_encontradas": [
                    {
                        "referencia": "28:123:45:67:890:AB",
                        "distancia_metros": 0,
                        "superficie": 12.5,
                        "uso_sigpac": "Tierra arable",
                        "centroide": {"lat": lat, "lng": lng}
                    },
                    {
                        "referencia": "28:123:45:67:891:CD",
                        "distancia_metros": 250,
                        "superficie": 8.3,
                        "uso_sigpac": "Olivar",
                        "centroide": {"lat": lat + 0.002, "lng": lng + 0.002}
                    }
                ],
                "total": 2
            }
        }
        
        logger.info(f"SIGPAC search at coordinates: {lat}, {lng}")
        return mock_results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching SIGPAC at {lat}, {lng}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "SIGPAC search error",
                "message": "Could not search parcelas"
            }
        )


@router.get("/provincias")
async def get_provincias():
    """Get list of Spanish provinces for SIGPAC"""
    
    provincias = {
        "success": True,
        "data": [
            {"codigo": "02", "nombre": "Albacete"},
            {"codigo": "03", "nombre": "Alicante"},
            {"codigo": "04", "nombre": "Almería"},
            {"codigo": "01", "nombre": "Araba/Álava"},
            {"codigo": "33", "nombre": "Asturias"},
            {"codigo": "05", "nombre": "Ávila"},
            {"codigo": "06", "nombre": "Badajoz"},
            {"codigo": "07", "nombre": "Balears, Illes"},
            {"codigo": "08", "nombre": "Barcelona"},
            {"codigo": "48", "nombre": "Bizkaia"},
            {"codigo": "09", "nombre": "Burgos"},
            {"codigo": "10", "nombre": "Cáceres"},
            {"codigo": "11", "nombre": "Cádiz"},
            {"codigo": "39", "nombre": "Cantabria"},
            {"codigo": "12", "nombre": "Castellón"},
            {"codigo": "13", "nombre": "Ciudad Real"},
            {"codigo": "14", "nombre": "Córdoba"},
            {"codigo": "15", "nombre": "Coruña, A"},
            {"codigo": "16", "nombre": "Cuenca"},
            {"codigo": "20", "nombre": "Gipuzkoa"},
            {"codigo": "17", "nombre": "Girona"},
            {"codigo": "18", "nombre": "Granada"},
            {"codigo": "19", "nombre": "Guadalajara"},
            {"codigo": "21", "nombre": "Huelva"},
            {"codigo": "22", "nombre": "Huesca"},
            {"codigo": "23", "nombre": "Jaén"},
            {"codigo": "24", "nombre": "León"},
            {"codigo": "25", "nombre": "Lleida"},
            {"codigo": "27", "nombre": "Lugo"},
            {"codigo": "28", "nombre": "Madrid"},
            {"codigo": "29", "nombre": "Málaga"},
            {"codigo": "30", "nombre": "Murcia"},
            {"codigo": "31", "nombre": "Navarra"},
            {"codigo": "32", "nombre": "Ourense"},
            {"codigo": "34", "nombre": "Palencia"},
            {"codigo": "35", "nombre": "Palmas, Las"},
            {"codigo": "36", "nombre": "Pontevedra"},
            {"codigo": "26", "nombre": "Rioja, La"},
            {"codigo": "37", "nombre": "Salamanca"},
            {"codigo": "38", "nombre": "Santa Cruz de Tenerife"},
            {"codigo": "40", "nombre": "Segovia"},
            {"codigo": "41", "nombre": "Sevilla"},
            {"codigo": "42", "nombre": "Soria"},
            {"codigo": "43", "nombre": "Tarragona"},
            {"codigo": "44", "nombre": "Teruel"},
            {"codigo": "45", "nombre": "Toledo"},
            {"codigo": "46", "nombre": "Valencia"},
            {"codigo": "47", "nombre": "Valladolid"},
            {"codigo": "49", "nombre": "Zamora"},
            {"codigo": "50", "nombre": "Zaragoza"}
        ]
    }
    
    return provincias


@router.get("/validar/{referencia}")
async def validate_reference(referencia: str):
    """Validate SIGPAC reference format"""
    
    is_valid = validate_sigpac_reference(referencia)
    
    return {
        "success": True,
        "data": {
            "referencia": referencia,
            "valida": is_valid,
            "formato_esperado": "PP:MMM:AAAA:ZZZZZ:PPPP:RR",
            "descripcion": {
                "PP": "Provincia (2 dígitos)",
                "MMM": "Municipio (3 dígitos)",
                "AAAA": "Agregado (4 dígitos)",
                "ZZZZZ": "Zona (5 dígitos)",
                "PPPP": "Polígono (4 dígitos)",
                "RR": "Parcela (2 dígitos)"
            }
        }
    }


def validate_sigpac_reference(referencia: str) -> bool:
    """Validate SIGPAC reference format"""
    
    # Pattern with separators: PP:MMM:AAAA:ZZZZZ:PPPP:RR
    pattern_with_separators = r'^\d{2}:\d{3}:[A-Z0-9]{4}:\d{5}:\d{4}:[A-Z0-9]{2}$'
    
    # Pattern without separators (SIGPAC official): PPMMMAAAAAZZZZZPPPPRRR
    # Note: AAAA (agregado), ZZZZZ (zona), PPPP (parcela) can contain letters and numbers
    # RR (recinto) can be 1 or 2 characters
    pattern_without_separators = r'^\d{2}\d{3}[A-Z0-9]{4}[A-Z0-9]{5}[A-Z0-9]{4}[A-Z0-9]{1,2}$'
    
    return bool(re.match(pattern_with_separators, referencia) or re.match(pattern_without_separators, referencia))


@router.get("/wms/capabilities")
async def get_wms_capabilities():
    """Get WMS service capabilities"""
    
    return {
        "success": True,
        "data": {
            "service": "WMS",
            "version": "1.3.0",
            "url": "https://www.ign.es/wms-inspire/pnoa-ma",
            "layers": [
                {
                    "name": "OI.OrthoimageCoverage",
                    "title": "Ortoimagen PNOA",
                    "srs": ["EPSG:4326", "EPSG:3857", "EPSG:25830"]
                }
            ],
            "formats": ["image/png", "image/jpeg"],
            "styles": ["default"]
        }
    }