"""
Weather routes - Meteorological data and agricultural alerts
"""

from fastapi import APIRouter, HTTPException, Query
import httpx
from datetime import datetime, timedelta
from loguru import logger
from typing import Optional

from app.config.settings import settings

router = APIRouter()


@router.get("/current/{lat}/{lng}")
async def get_current_weather(
    lat: float,
    lng: float,
    provider: Optional[str] = Query("openweather", description="Weather provider")
):
    """Get current weather conditions for coordinates"""
    
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
        
        weather_data = await fetch_weather_data(lat, lng, provider)
        
        # Add agricultural recommendations
        recommendations = generate_agricultural_recommendations(weather_data)
        
        result = {
            "success": True,
            "data": {
                "coordinates": {"lat": lat, "lng": lng},
                "current": weather_data,
                "agricultural_recommendations": recommendations,
                "provider": provider,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        logger.info(f"Weather data retrieved for coordinates: {lat}, {lng}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving weather data for {lat}, {lng}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Weather service error",
                "message": "Could not retrieve weather data"
            }
        )


@router.get("/forecast/{lat}/{lng}")
async def get_weather_forecast(
    lat: float,
    lng: float,
    days: Optional[int] = Query(7, ge=1, le=14, description="Number of forecast days"),
    provider: Optional[str] = Query("openweather", description="Weather provider")
):
    """Get weather forecast for coordinates"""
    
    try:
        forecast_data = await fetch_forecast_data(lat, lng, days, provider)
        
        # Generate alerts for agricultural activities
        alerts = generate_weather_alerts(forecast_data)
        
        result = {
            "success": True,
            "data": {
                "coordinates": {"lat": lat, "lng": lng},
                "forecast": forecast_data,
                "alerts": alerts,
                "days": days,
                "provider": provider,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error retrieving forecast for {lat}, {lng}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving forecast data")


@router.get("/alerts/{lat}/{lng}")
async def get_weather_alerts(
    lat: float,
    lng: float,
    cultivo: Optional[str] = Query(None, description="Crop type for specific alerts")
):
    """Get weather alerts for agricultural activities"""
    
    try:
        # Get current and forecast weather
        current_weather = await fetch_weather_data(lat, lng, "openweather")
        forecast_data = await fetch_forecast_data(lat, lng, 5, "openweather")
        
        # Generate comprehensive alerts
        alerts = []
        
        # Frost alert
        if current_weather.get("temperature", 20) < 2:
            alerts.append({
                "type": "helada",
                "severity": "high",
                "title": "Alerta de Helada",
                "message": "Riesgo de helada. Proteger cultivos sensibles.",
                "recommendations": [
                    "Activar sistemas anti-helada",
                    "Cubrir plantas sensibles",
                    "Regar temprano para aumentar humedad"
                ]
            })
        
        # High wind alert
        if current_weather.get("wind_speed", 0) > 20:
            alerts.append({
                "type": "viento",
                "severity": "medium",
                "title": "Viento Fuerte",
                "message": "Vientos fuertes pueden dañar cultivos y dificultar aplicaciones.",
                "recommendations": [
                    "Postponer aplicaciones de fitosanitarios",
                    "Revisar estructuras y tutores",
                    "Evitar trabajos en altura"
                ]
            })
        
        # Rain alert
        upcoming_rain = any(day.get("precipitation", 0) > 5 for day in forecast_data[:3])
        if upcoming_rain:
            alerts.append({
                "type": "lluvia",
                "severity": "low",
                "title": "Lluvia Prevista",
                "message": "Se prevén precipitaciones en los próximos días.",
                "recommendations": [
                    "Adelantar aplicaciones si es necesario",
                    "Preparar sistemas de drenaje",
                    "Planificar trabajos de campo"
                ]
            })
        
        # High temperature alert
        if current_weather.get("temperature", 20) > 35:
            alerts.append({
                "type": "calor",
                "severity": "medium",
                "title": "Temperatura Elevada",
                "message": "Temperaturas altas pueden estresar los cultivos.",
                "recommendations": [
                    "Aumentar frecuencia de riego",
                    "Evitar trabajos en horas centrales",
                    "Monitorear signos de estrés hídrico"
                ]
            })
        
        return {
            "success": True,
            "data": {
                "coordinates": {"lat": lat, "lng": lng},
                "alerts": alerts,
                "total_alerts": len(alerts),
                "cultivo": cultivo,
                "generated_at": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating weather alerts for {lat}, {lng}: {e}")
        raise HTTPException(status_code=500, detail="Error generating weather alerts")


@router.get("/stations")
async def get_weather_stations():
    """Get available weather stations"""
    
    # Mock weather stations data
    stations = {
        "success": True,
        "data": [
            {
                "id": "ES001",
                "name": "Madrid-Barajas",
                "coordinates": {"lat": 40.4719, "lng": -3.5626},
                "altitude": 609,
                "provider": "AEMET"
            },
            {
                "id": "ES002", 
                "name": "Barcelona-El Prat",
                "coordinates": {"lat": 41.2971, "lng": 2.0785},
                "altitude": 4,
                "provider": "AEMET"
            },
            {
                "id": "ES003",
                "name": "Sevilla-San Pablo",
                "coordinates": {"lat": 37.4180, "lng": -5.8931},
                "altitude": 34,
                "provider": "AEMET"
            }
        ]
    }
    
    return stations


async def fetch_weather_data(lat: float, lng: float, provider: str) -> dict:
    """Fetch current weather data from provider"""
    
    # Mock weather data for development
    # TODO: Implement real weather API integration
    
    mock_data = {
        "temperature": 22.5,
        "humidity": 65,
        "pressure": 1013.2,
        "wind_speed": 8.5,
        "wind_direction": 180,
        "precipitation": 0.0,
        "cloud_cover": 25,
        "visibility": 10000,
        "uv_index": 6,
        "weather_condition": "partly_cloudy",
        "description": "Parcialmente nublado",
        "feels_like": 24.1
    }
    
    return mock_data


async def fetch_forecast_data(lat: float, lng: float, days: int, provider: str) -> list:
    """Fetch weather forecast data"""
    
    # Mock forecast data
    forecast = []
    base_date = datetime.utcnow()
    
    for i in range(days):
        date = base_date + timedelta(days=i)
        forecast.append({
            "date": date.strftime("%Y-%m-%d"),
            "temperature_max": 25 + (i % 3),
            "temperature_min": 15 + (i % 2),
            "humidity": 60 + (i * 2),
            "precipitation": 0.0 if i % 3 != 0 else 2.5,
            "wind_speed": 7 + (i % 2),
            "weather_condition": "sunny" if i % 2 == 0 else "cloudy",
            "description": "Soleado" if i % 2 == 0 else "Nublado"
        })
    
    return forecast


def generate_agricultural_recommendations(weather_data: dict) -> list:
    """Generate agricultural recommendations based on weather"""
    
    recommendations = []
    
    temp = weather_data.get("temperature", 20)
    humidity = weather_data.get("humidity", 50)
    wind_speed = weather_data.get("wind_speed", 0)
    precipitation = weather_data.get("precipitation", 0)
    
    # Temperature-based recommendations
    if temp < 5:
        recommendations.append({
            "category": "temperatura",
            "message": "Proteger cultivos del frío",
            "priority": "high"
        })
    elif temp > 30:
        recommendations.append({
            "category": "temperatura", 
            "message": "Aumentar riego por altas temperaturas",
            "priority": "medium"
        })
    
    # Humidity recommendations
    if humidity > 80:
        recommendations.append({
            "category": "humedad",
            "message": "Alta humedad - vigilar enfermedades fúngicas",
            "priority": "medium"
        })
    elif humidity < 30:
        recommendations.append({
            "category": "humedad",
            "message": "Baja humedad - aumentar riego",
            "priority": "low"
        })
    
    # Wind recommendations
    if wind_speed > 15:
        recommendations.append({
            "category": "viento",
            "message": "Evitar aplicaciones por viento fuerte",
            "priority": "high"
        })
    
    # Precipitation recommendations
    if precipitation > 0:
        recommendations.append({
            "category": "lluvia",
            "message": "Adaptar programación de riegos y aplicaciones",
            "priority": "medium"
        })
    
    return recommendations


def generate_weather_alerts(forecast_data: list) -> list:
    """Generate weather alerts from forecast data"""
    
    alerts = []
    
    for day in forecast_data[:3]:  # Check next 3 days
        # Frost alert
        if day.get("temperature_min", 20) < 2:
            alerts.append({
                "type": "helada",
                "date": day["date"],
                "severity": "high",
                "message": f"Riesgo de helada el {day['date']}"
            })
        
        # Heavy rain alert  
        if day.get("precipitation", 0) > 10:
            alerts.append({
                "type": "lluvia_intensa",
                "date": day["date"],
                "severity": "medium",
                "message": f"Lluvia intensa prevista el {day['date']}"
            })
    
    return alerts