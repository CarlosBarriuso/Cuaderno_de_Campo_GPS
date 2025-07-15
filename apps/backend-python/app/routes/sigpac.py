"""
SIGPAC routes - Sistema de Información Geográfica de Parcelas Agrícolas
"""

from fastapi import APIRouter, HTTPException, Query
import httpx
import re
from loguru import logger
from typing import Optional

router = APIRouter()


@router.get("/parcela/{referencia}")
async def get_parcela_sigpac(referencia: str):
    """Get SIGPAC parcela information by reference"""
    
    try:
        # Validate SIGPAC reference format (PP:MMM:AAAA:ZZZZZ:PPPP:RR)
        if not validate_sigpac_reference(referencia):
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": "Invalid SIGPAC reference format",
                    "message": "Reference must follow format PP:MMM:AAAA:ZZZZZ:PPPP:RR"
                }
            )
        
        # Parse reference parts
        parts = referencia.split(":")
        provincia = parts[0]
        municipio = parts[1]
        agregado = parts[2]
        zona = parts[3]
        poligono = parts[4] if len(parts) > 4 else None
        parcela = parts[5] if len(parts) > 5 else None
        
        # Mock SIGPAC data for development
        # TODO: Implement real SIGPAC WMS service integration
        mock_data = {
            "success": True,
            "data": {
                "referencia": referencia,
                "provincia": provincia,
                "municipio": municipio,
                "agregado": agregado,
                "zona": zona,
                "poligono": poligono,
                "parcela": parcela,
                "superficie": 12.5,
                "uso_sigpac": "Tierra arable",
                "geometria": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-3.7038, 40.4168],
                        [-3.7028, 40.4168],
                        [-3.7028, 40.4158],
                        [-3.7038, 40.4158],
                        [-3.7038, 40.4168]
                    ]]
                },
                "centroide": {
                    "type": "Point",
                    "coordinates": [-3.7033, 40.4163]
                },
                "metadata": {
                    "fuente": "SIGPAC",
                    "año": 2024,
                    "precision": "alta"
                }
            }
        }
        
        logger.info(f"Retrieved SIGPAC data for reference: {referencia}")
        return mock_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving SIGPAC data for {referencia}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "SIGPAC service error",
                "message": "Could not retrieve parcela information"
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
    
    # Pattern: PP:MMM:AAAA:ZZZZZ:PPPP:RR
    pattern = r'^\d{2}:\d{3}:\d{4}:\d{5}:\d{4}:[A-Z0-9]{2}$'
    
    return bool(re.match(pattern, referencia))


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