"""
Subscription and billing routes
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from loguru import logger

from app.middleware.auth import get_current_user, get_optional_user

router = APIRouter()


class SubscriptionPlan(BaseModel):
    id: str
    name: str
    description: str
    price: float
    currency: str
    interval: str  # 'month' or 'year'
    features: List[str]
    max_parcelas: int
    max_actividades: int
    storage_gb: float
    ocr_monthly_limit: int
    weather_api_calls: int
    priority_support: bool
    advanced_analytics: bool
    export_formats: List[str]


class SubscriptionStatus(BaseModel):
    user_id: str
    plan_id: str
    plan_name: str
    status: str  # 'active', 'canceled', 'past_due', 'trialing'
    current_period_start: str
    current_period_end: str
    cancel_at_period_end: bool
    trial_end: Optional[str]


# Mock subscription plans data
SUBSCRIPTION_PLANS = [
    {
        "id": "plan_basic",
        "name": "Básico",
        "description": "Perfecto para pequeñas explotaciones agrícolas",
        "price": 9.99,
        "currency": "EUR",
        "interval": "month",
        "features": [
            "Hasta 5 parcelas",
            "Registro básico de actividades",
            "Mapas GPS básicos",
            "2GB de almacenamiento",
            "Soporte por email"
        ],
        "max_parcelas": 5,
        "max_actividades": 50,
        "storage_gb": 2,
        "ocr_monthly_limit": 10,
        "weather_api_calls": 100,
        "priority_support": False,
        "advanced_analytics": False,
        "export_formats": ["PDF"]
    },
    {
        "id": "plan_pro",
        "name": "Profesional",
        "description": "Para agricultores que necesitan más funcionalidades",
        "price": 24.99,
        "currency": "EUR",
        "interval": "month",
        "features": [
            "Hasta 25 parcelas",
            "Actividades ilimitadas",
            "Análisis avanzados",
            "OCR de documentos",
            "Integración meteorológica",
            "10GB de almacenamiento",
            "Soporte prioritario"
        ],
        "max_parcelas": 25,
        "max_actividades": -1,  # Unlimited
        "storage_gb": 10,
        "ocr_monthly_limit": 100,
        "weather_api_calls": 1000,
        "priority_support": True,
        "advanced_analytics": True,
        "export_formats": ["PDF", "Excel", "CSV"]
    },
    {
        "id": "plan_enterprise",
        "name": "Empresarial",
        "description": "Para grandes explotaciones y cooperativas",
        "price": 99.99,
        "currency": "EUR",
        "interval": "month",
        "features": [
            "Parcelas ilimitadas",
            "Actividades ilimitadas",
            "Analytics empresariales",
            "OCR ilimitado",
            "API completa",
            "Integración SIGPAC",
            "100GB de almacenamiento",
            "Soporte 24/7",
            "Gestor de cuenta dedicado"
        ],
        "max_parcelas": -1,  # Unlimited
        "max_actividades": -1,  # Unlimited
        "storage_gb": 100,
        "ocr_monthly_limit": -1,  # Unlimited
        "weather_api_calls": -1,  # Unlimited
        "priority_support": True,
        "advanced_analytics": True,
        "export_formats": ["PDF", "Excel", "CSV", "JSON", "XML"]
    },
    {
        "id": "plan_free",
        "name": "Gratuito",
        "description": "Prueba gratuita para empezar",
        "price": 0.0,
        "currency": "EUR",
        "interval": "month",
        "features": [
            "1 parcela",
            "10 actividades por mes",
            "Mapas básicos",
            "500MB de almacenamiento",
            "Soporte comunitario"
        ],
        "max_parcelas": 1,
        "max_actividades": 10,
        "storage_gb": 0.5,
        "ocr_monthly_limit": 5,
        "weather_api_calls": 50,
        "priority_support": False,
        "advanced_analytics": False,
        "export_formats": ["PDF"]
    }
]


@router.get("/plans")
async def get_subscription_plans():
    """Get all available subscription plans"""
    
    try:
        plans = [SubscriptionPlan(**plan) for plan in SUBSCRIPTION_PLANS]
        
        return {
            "success": True,
            "data": plans
        }
        
    except Exception as e:
        logger.error(f"Error getting subscription plans: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Failed to get subscription plans",
                "message": str(e)
            }
        )


@router.get("/plans/{plan_id}")
async def get_subscription_plan(plan_id: str):
    """Get specific subscription plan details"""
    
    try:
        plan = next((plan for plan in SUBSCRIPTION_PLANS if plan["id"] == plan_id), None)
        
        if not plan:
            raise HTTPException(
                status_code=404,
                detail={
                    "success": False,
                    "error": "Plan not found",
                    "message": f"Subscription plan {plan_id} not found"
                }
            )
        
        return {
            "success": True,
            "data": SubscriptionPlan(**plan)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting subscription plan {plan_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Failed to get subscription plan",
                "message": str(e)
            }
        )


@router.get("/limits")
async def get_subscription_limits(current_user: dict = Depends(get_current_user)):
    """Get current user's subscription limits based on their Clerk plan"""
    
    try:
        # Get user information from Clerk
        user_id = current_user.get("id")
        user_email = current_user.get("email_addresses", [{}])[0].get("email_address")
        
        # Get subscription plan from Clerk metadata
        user_metadata = current_user.get("public_metadata", {})
        plan_id = user_metadata.get("subscriptionPlan", "plan_free")
        subscription_status = user_metadata.get("subscriptionStatus", "active")
        
        logger.info(f"Getting limits for user: {user_id} with plan: {plan_id}")
        
        # Find the plan details
        plan_details = None
        for plan in SUBSCRIPTION_PLANS:
            if plan["id"] == plan_id:
                plan_details = plan
                break
        
        if not plan_details:
            # Default to free plan if plan not found
            plan_details = next((plan for plan in SUBSCRIPTION_PLANS if plan["id"] == "plan_free"), SUBSCRIPTION_PLANS[0])
            
        # TODO: Get real usage from database
        # For now, return mock usage data
        current_usage = {
            "parcelas_used": 0,
            "actividades_used": 0,
            "storage_used_gb": 0,
            "ocr_calls_this_month": 0,
            "weather_calls_this_month": 0
        }
        
        # Calculate usage percentages
        usage_percentages = {
            "parcelas": (current_usage["parcelas_used"] / plan_details["max_parcelas"] * 100) if plan_details["max_parcelas"] > 0 else 0,
            "actividades": (current_usage["actividades_used"] / plan_details["max_actividades"] * 100) if plan_details["max_actividades"] > 0 else 0,
            "storage": (current_usage["storage_used_gb"] / plan_details["storage_gb"] * 100),
            "ocr": (current_usage["ocr_calls_this_month"] / plan_details["ocr_monthly_limit"] * 100) if plan_details["ocr_monthly_limit"] > 0 else 0
        }
        
        limits_data = {
            "user_id": user_id,
            "plan_id": plan_id,
            "plan_name": plan_details["name"],
            "status": subscription_status,
            "limits": {
                "max_parcelas": plan_details["max_parcelas"],
                "max_actividades": plan_details["max_actividades"],
                "storage_gb": plan_details["storage_gb"],
                "ocr_monthly_limit": plan_details["ocr_monthly_limit"],
                "weather_api_calls": plan_details["weather_api_calls"]
            },
            "current_usage": current_usage,
            "usage_percentages": usage_percentages,
            "features": {
                "priority_support": plan_details["priority_support"],
                "advanced_analytics": plan_details["advanced_analytics"],
                "export_formats": plan_details["export_formats"]
            }\n        }\n        \n        return {\n            \"success\": True,\n            \"data\": limits_data\n        }\n        \n    except Exception as e:\n        logger.error(f\"Error getting subscription limits for user {current_user.get('id')}: {e}\")\n        raise HTTPException(\n            status_code=500,\n            detail={\n                \"success\": False,\n                \"error\": \"Failed to get subscription limits\",\n                \"message\": str(e)\n            }\n        )"}, {"old_string": "@router.post(\"/upgrade\")\nasync def upgrade_subscription(\n    upgrade_request: UpgradeRequest,\n    current_user: dict = Depends(get_current_user)\n):\n    \"\"\"Upgrade user's subscription to a new plan\"\"\"\n    \n    try:\n        # Verify plan exists\n        plan = next((plan for plan in SUBSCRIPTION_PLANS if plan[\"id\"] == upgrade_request.plan_id), None)\n        \n        if not plan:\n            raise HTTPException(\n                status_code=404,\n                detail={\n                    \"success\": False,\n                    \"error\": \"Plan not found\",\n                    \"message\": f\"Subscription plan {upgrade_request.plan_id} not found\"\n                }\n            )\n        \n        # Mock upgrade response\n        # In production, this would handle payment processing\n        logger.info(f\"User {current_user.get('email')} upgrading to plan {upgrade_request.plan_id}\")\n        \n        return {\n            \"success\": True,\n            \"data\": {\n                \"message\": \"Subscription upgraded successfully\",\n                \"new_plan\": plan[\"name\"],\n                \"plan_id\": upgrade_request.plan_id,\n                \"user_id\": current_user.get(\"id\"),\n                \"effective_date\": \"2025-07-15T13:45:00Z\"\n            }\n        }\n        \n    except HTTPException:\n        raise\n    except Exception as e:\n        logger.error(f\"Error upgrading subscription for user {current_user.get('id')}: {e}\")\n        raise HTTPException(\n            status_code=500,\n            detail={\n                \"success\": False,\n                \"error\": \"Failed to upgrade subscription\",\n                \"message\": str(e)\n            }\n        )", "new_string": "# Subscription upgrade is now handled by Clerk frontend\n# This endpoint is no longer needed as Clerk manages billing"}, {"old_string": "@router.post(\"/cancel\")\nasync def cancel_subscription(current_user: dict = Depends(get_current_user)):\n    \"\"\"Cancel user's current subscription\"\"\"\n    \n    try:\n        user_id = current_user.get(\"id\")\n        user_email = current_user.get(\"email\")\n        \n        # Mock cancellation response\n        # In production, this would handle subscription cancellation\n        logger.info(f\"User {user_email} cancelling subscription\")\n        \n        return {\n            \"success\": True,\n            \"data\": {\n                \"message\": \"Subscription cancelled successfully\",\n                \"user_id\": user_id,\n                \"cancelled_at\": \"2025-07-15T13:45:00Z\",\n                \"effective_date\": \"2025-02-15T00:00:00Z\"  # End of current period\n            }\n        }\n        \n    except Exception as e:\n        logger.error(f\"Error cancelling subscription for user {current_user.get('id')}: {e}\")\n        raise HTTPException(\n            status_code=500,\n            detail={\n                \"success\": False,\n                \"error\": \"Failed to cancel subscription\",\n                \"message\": str(e)\n            }\n        )", "new_string": "# Subscription cancellation is now handled by Clerk frontend\n# This endpoint is no longer needed as Clerk manages billing"}]


class UpgradeRequest(BaseModel):
    plan_id: str

@router.post("/upgrade")
async def upgrade_subscription(
    upgrade_request: UpgradeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Upgrade user's subscription to a new plan"""
    
    try:
        # Verify plan exists
        plan = next((plan for plan in SUBSCRIPTION_PLANS if plan["id"] == upgrade_request.plan_id), None)
        
        if not plan:
            raise HTTPException(
                status_code=404,
                detail={
                    "success": False,
                    "error": "Plan not found",
                    "message": f"Subscription plan {upgrade_request.plan_id} not found"
                }
            )
        
        # Mock upgrade response
        # In production, this would handle payment processing
        logger.info(f"User {current_user.get('email')} upgrading to plan {upgrade_request.plan_id}")
        
        return {
            "success": True,
            "data": {
                "message": "Subscription upgraded successfully",
                "new_plan": plan["name"],
                "plan_id": upgrade_request.plan_id,
                "user_id": current_user.get("id"),
                "effective_date": "2025-07-15T13:45:00Z"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error upgrading subscription for user {current_user.get('id')}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Failed to upgrade subscription",
                "message": str(e)
            }
        )


@router.post("/cancel")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    """Cancel user's subscription"""
    
    try:
        # Mock cancellation
        # In production, this would update the subscription in the database
        logger.info(f"User {current_user.get('email')} canceling subscription")
        
        return {
            "success": True,
            "data": {
                "message": "Subscription canceled successfully",
                "user_id": current_user.get("id"),
                "canceled_at": "2025-07-15T13:45:00Z",
                "effective_until": "2025-02-15T00:00:00Z"
            }
        }
        
    except Exception as e:
        logger.error(f"Error canceling subscription for user {current_user.get('id')}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Failed to cancel subscription",
                "message": str(e)
            }
        )


@router.get("/usage")
async def get_subscription_usage(current_user: dict = Depends(get_current_user)):
    """Get current subscription usage statistics"""
    
    try:
        # Mock usage data
        # In production, this would query actual usage from database
        mock_usage = {
            "current_plan": "plan_basic",
            "usage": {
                "parcelas": {
                    "used": 3,
                    "limit": 5,
                    "percentage": 60
                },
                "actividades": {
                    "used": 25,
                    "limit": 50,
                    "percentage": 50
                },
                "storage": {
                    "used_gb": 0.8,
                    "limit_gb": 2,
                    "percentage": 40
                },
                "ocr_calls": {
                    "used": 5,
                    "limit": 10,
                    "percentage": 50
                },
                "weather_calls": {
                    "used": 45,
                    "limit": 100,
                    "percentage": 45
                }
            },
            "period": {
                "start": "2025-01-15T00:00:00Z",
                "end": "2025-02-15T00:00:00Z"
            }
        }
        
        return {
            "success": True,
            "data": mock_usage
        }
        
    except Exception as e:
        logger.error(f"Error getting subscription usage for user {current_user.get('id')}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Failed to get subscription usage",
                "message": str(e)
            }
        )


@router.get("/billing/history")
async def get_billing_history(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=100)
):
    """Get billing history for the user"""
    
    try:
        # Mock billing history
        mock_history = [
            {
                "id": "inv_001",
                "date": "2025-01-15T00:00:00Z",
                "amount": 9.99,
                "currency": "EUR",
                "status": "paid",
                "plan": "Básico",
                "period": "2025-01-15 to 2025-02-15"
            },
            {
                "id": "inv_002",
                "date": "2024-12-15T00:00:00Z",
                "amount": 9.99,
                "currency": "EUR",
                "status": "paid",
                "plan": "Básico",
                "period": "2024-12-15 to 2025-01-15"
            }
        ]
        
        return {
            "success": True,
            "data": {
                "invoices": mock_history[:limit],
                "total_count": len(mock_history),
                "user_id": current_user.get("id")
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting billing history for user {current_user.get('id')}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Failed to get billing history",
                "message": str(e)
            }
        )