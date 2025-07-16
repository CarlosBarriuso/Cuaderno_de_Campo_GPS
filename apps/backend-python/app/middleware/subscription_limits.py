"""
Middleware for enforcing subscription plan limits
"""

from fastapi import HTTPException, Request, Depends
from typing import Dict, Any, Optional
from loguru import logger

from app.middleware.auth import get_current_user

# Plan limits configuration
PLAN_LIMITS = {
    'plan_free': {
        'max_parcelas': 1,
        'max_actividades': 10,
        'storage_gb': 0.5,
        'ocr_monthly_limit': 5,
        'weather_api_calls': 50,
        'priority_support': False,
        'advanced_analytics': False,
        'export_formats': ['PDF']
    },
    'plan_basic': {
        'max_parcelas': 5,
        'max_actividades': 50,
        'storage_gb': 2,
        'ocr_monthly_limit': 10,
        'weather_api_calls': 100,
        'priority_support': False,
        'advanced_analytics': False,
        'export_formats': ['PDF']
    },
    'plan_pro': {
        'max_parcelas': 25,
        'max_actividades': -1,  # Unlimited
        'storage_gb': 10,
        'ocr_monthly_limit': 100,
        'weather_api_calls': 1000,
        'priority_support': True,
        'advanced_analytics': True,
        'export_formats': ['PDF', 'Excel', 'CSV']
    },
    'plan_enterprise': {
        'max_parcelas': -1,  # Unlimited
        'max_actividades': -1,  # Unlimited
        'storage_gb': 100,
        'ocr_monthly_limit': -1,  # Unlimited
        'weather_api_calls': -1,  # Unlimited
        'priority_support': True,
        'advanced_analytics': True,
        'export_formats': ['PDF', 'Excel', 'CSV', 'JSON', 'XML']
    }
}

async def get_user_subscription(user: Dict[str, Any]) -> Dict[str, Any]:
    """Get user's current subscription details"""
    # In a real application, this would query the database
    # For now, we'll use mock data based on the user
    
    # Mock subscription data
    return {
        'plan_id': 'plan_basic',  # Default plan
        'plan_name': 'Básico',
        'status': 'active',
        'current_period_start': '2025-01-15T00:00:00Z',
        'current_period_end': '2025-02-15T00:00:00Z',
        'cancel_at_period_end': False
    }

async def get_user_usage(user: Dict[str, Any]) -> Dict[str, Any]:
    """Get user's current usage statistics"""
    # In a real application, this would query the database
    # For now, we'll use mock data
    
    return {
        'parcelas': 3,
        'actividades': 25,
        'storage_gb': 0.8,
        'ocr_calls_this_month': 5,
        'weather_calls_this_month': 45
    }

def check_resource_limit(
    plan_id: str, 
    resource: str, 
    current_usage: int, 
    increment: int = 1
) -> Dict[str, Any]:
    """
    Check if a user can use a specific resource
    
    Args:
        plan_id: User's subscription plan ID
        resource: Resource name (e.g., 'max_parcelas', 'max_actividades')
        current_usage: Current usage count
        increment: How much to increment (default 1)
    
    Returns:
        Dict with 'allowed' (bool) and 'message' (str)
    """
    
    if plan_id not in PLAN_LIMITS:
        return {
            'allowed': False,
            'message': f'Plan {plan_id} not found'
        }
    
    plan_limits = PLAN_LIMITS[plan_id]
    limit = plan_limits.get(resource, 0)
    
    # -1 means unlimited
    if limit == -1:
        return {
            'allowed': True,
            'message': 'Unlimited resource'
        }
    
    if current_usage + increment > limit:
        return {
            'allowed': False,
            'message': f'Limit exceeded. Plan {plan_id} allows {limit} {resource}, you have {current_usage}'
        }
    
    return {
        'allowed': True,
        'message': f'Within limits ({current_usage + increment}/{limit})'
    }

def check_feature_access(plan_id: str, feature: str) -> Dict[str, Any]:
    """
    Check if a user has access to a specific feature
    
    Args:
        plan_id: User's subscription plan ID
        feature: Feature name (e.g., 'priority_support', 'advanced_analytics')
    
    Returns:
        Dict with 'allowed' (bool) and 'message' (str)
    """
    
    if plan_id not in PLAN_LIMITS:
        return {
            'allowed': False,
            'message': f'Plan {plan_id} not found'
        }
    
    plan_limits = PLAN_LIMITS[plan_id]
    has_access = plan_limits.get(feature, False)
    
    if not has_access:
        return {
            'allowed': False,
            'message': f'Feature {feature} not available in plan {plan_id}'
        }
    
    return {
        'allowed': True,
        'message': f'Feature {feature} available'
    }

async def require_plan_limit(
    resource: str,
    increment: int = 1,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Dependency to check resource limits before allowing an operation
    """
    
    try:
        # Get user's subscription
        subscription = await get_user_subscription(current_user)
        plan_id = subscription['plan_id']
        
        # Get current usage
        usage = await get_user_usage(current_user)
        current_usage = usage.get(resource.replace('max_', ''), 0)
        
        # Check limit
        limit_check = check_resource_limit(plan_id, resource, current_usage, increment)
        
        if not limit_check['allowed']:
            logger.warning(f"User {current_user.get('email')} exceeded limit for {resource}: {limit_check['message']}")
            raise HTTPException(
                status_code=403,
                detail={
                    'success': False,
                    'error': 'Subscription limit exceeded',
                    'message': limit_check['message'],
                    'resource': resource,
                    'current_usage': current_usage,
                    'plan_id': plan_id,
                    'upgrade_required': True
                }
            )
        
        return {
            'allowed': True,
            'plan_id': plan_id,
            'current_usage': current_usage,
            'message': limit_check['message']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking subscription limits: {e}")
        # In case of error, allow the operation (fail open)
        return {
            'allowed': True,
            'plan_id': 'unknown',
            'current_usage': 0,
            'message': 'Limit check failed, allowing operation'
        }

async def require_feature_access(
    feature: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Dependency to check feature access before allowing an operation
    """
    
    try:
        # Get user's subscription
        subscription = await get_user_subscription(current_user)
        plan_id = subscription['plan_id']
        
        # Check feature access
        access_check = check_feature_access(plan_id, feature)
        
        if not access_check['allowed']:
            logger.warning(f"User {current_user.get('email')} tried to access {feature}: {access_check['message']}")
            raise HTTPException(
                status_code=403,
                detail={
                    'success': False,
                    'error': 'Feature not available',
                    'message': access_check['message'],
                    'feature': feature,
                    'plan_id': plan_id,
                    'upgrade_required': True
                }
            )
        
        return {
            'allowed': True,
            'plan_id': plan_id,
            'feature': feature,
            'message': access_check['message']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking feature access: {e}")
        # In case of error, allow the operation (fail open)
        return {
            'allowed': True,
            'plan_id': 'unknown',
            'feature': feature,
            'message': 'Feature check failed, allowing operation'
        }

class SubscriptionLimitChecker:
    """Helper class for checking subscription limits"""
    
    def __init__(self, user: Dict[str, Any]):
        self.user = user
        self._subscription = None
        self._usage = None
    
    async def get_subscription(self):
        if self._subscription is None:
            self._subscription = await get_user_subscription(self.user)
        return self._subscription
    
    async def get_usage(self):
        if self._usage is None:
            self._usage = await get_user_usage(self.user)
        return self._usage
    
    async def can_create_parcela(self) -> bool:
        subscription = await self.get_subscription()
        usage = await self.get_usage()
        
        limit_check = check_resource_limit(
            subscription['plan_id'],
            'max_parcelas',
            usage.get('parcelas', 0),
            1
        )
        
        return limit_check['allowed']
    
    async def can_create_actividad(self) -> bool:
        subscription = await self.get_subscription()
        usage = await self.get_usage()
        
        limit_check = check_resource_limit(
            subscription['plan_id'],
            'max_actividades',
            usage.get('actividades', 0),
            1
        )
        
        return limit_check['allowed']
    
    async def can_use_advanced_analytics(self) -> bool:
        subscription = await self.get_subscription()
        
        access_check = check_feature_access(
            subscription['plan_id'],
            'advanced_analytics'
        )
        
        return access_check['allowed']
    
    async def can_use_priority_support(self) -> bool:
        subscription = await self.get_subscription()
        
        access_check = check_feature_access(
            subscription['plan_id'],
            'priority_support'
        )
        
        return access_check['allowed']