'use client'

import { useEffect, useState } from 'react'
import { useAuthenticatedApi } from './useAuthenticatedApi'
import { api } from '@/lib/api'
import { useUser } from '@clerk/nextjs'

interface Subscription {
  plan: 'plan_free' | 'plan_basic' | 'plan_professional' | 'plan_enterprise'
  status: 'active' | 'inactive' | 'cancelled' | 'expired'
  max_parcelas: number
  max_actividades: number
  storage_gb: number
  ocr_monthly_limit: number
  weather_api_calls: number
  priority_support: boolean
  advanced_analytics: boolean
  export_formats: string[]
  // User information
  user_id?: string
  user_email?: string
  user_name?: string
  // Legacy fields for backward compatibility
  hectareasLimite?: number
  hectareasUsadas?: number
  fechaInicio?: string
  fechaVencimiento?: string
  precio?: number
  moneda?: string
}

interface UserWithSubscription {
  id: string
  email: string
  firstName: string
  lastName: string
  subscription: Subscription
}

/**
 * Hook para obtener información de suscripción del usuario
 */
export function useSubscription() {
  const { isAuthReady } = useAuthenticatedApi()
  const { user: clerkUser, isSignedIn } = useUser()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [user, setUser] = useState<UserWithSubscription | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthReady && isSignedIn && clerkUser) {
      loadUserSubscription()
    }
  }, [isAuthReady, isSignedIn, clerkUser])

  const loadUserSubscription = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Loading user subscription info for user:', clerkUser?.id)
      
      // Try to get current subscription from our subscription API
      const response = await api.subscription.current()
      console.log('✅ User subscription response:', response)
      
      if (response.success && response.data) {
        // Enrich subscription data with user information
        const enrichedSubscription = {
          ...response.data,
          user_id: clerkUser?.id,
          user_email: clerkUser?.emailAddresses[0]?.emailAddress,
          user_name: clerkUser?.firstName || clerkUser?.emailAddresses[0]?.emailAddress
        }
        setSubscription(enrichedSubscription)
      } else {
        // If no subscription found, set default free plan for this user
        const defaultSubscription: Subscription = {
          plan: 'plan_free',
          status: 'active',
          max_parcelas: 1,
          max_actividades: 10,
          storage_gb: 0.5,
          ocr_monthly_limit: 5,
          weather_api_calls: 50,
          priority_support: false,
          advanced_analytics: false,
          export_formats: ['PDF'],
          hectareasLimite: 1,
          hectareasUsadas: 0,
          precio: 0,
          moneda: 'EUR',
          user_id: clerkUser?.id,
          user_email: clerkUser?.emailAddresses[0]?.emailAddress,
          user_name: clerkUser?.firstName || clerkUser?.emailAddresses[0]?.emailAddress
        }
        setSubscription(defaultSubscription)
      }
    } catch (error) {
      console.error('❌ Error loading subscription:', error)
      setError(error.message)
      
      // Set default subscription on error
      const defaultSubscription: Subscription = {
        plan: 'plan_free',
        status: 'active',
        max_parcelas: 1,
        max_actividades: 10,
        storage_gb: 0.5,
        ocr_monthly_limit: 5,
        weather_api_calls: 50,
        priority_support: false,
        advanced_analytics: false,
        export_formats: ['PDF'],
        hectareasLimite: 1,
        hectareasUsadas: 0,
        precio: 0,
        moneda: 'EUR'
      }
      setSubscription(defaultSubscription)
    } finally {
      setLoading(false)
    }
  }

  const getPlanDisplayName = (plan: string) => {
    const planNames = {
      plan_free: 'Gratuito',
      plan_basic: 'Básico',
      plan_professional: 'Profesional', 
      plan_enterprise: 'Enterprise',
      // Legacy support
      gratuito: 'Plan Gratuito',
      basico: 'Plan Básico',
      profesional: 'Plan Profesional', 
      enterprise: 'Plan Enterprise'
    }
    return planNames[plan] || plan
  }

  const getPlanColor = (plan: string) => {
    const planColors = {
      plan_free: 'bg-gray-100 text-gray-800',
      plan_basic: 'bg-blue-100 text-blue-800',
      plan_professional: 'bg-green-100 text-green-800',
      plan_enterprise: 'bg-purple-100 text-purple-800',
      // Legacy support
      gratuito: 'bg-gray-100 text-gray-800',
      basico: 'bg-blue-100 text-blue-800',
      profesional: 'bg-green-100 text-green-800',
      enterprise: 'bg-purple-100 text-purple-800'
    }
    return planColors[plan] || 'bg-gray-100 text-gray-800'
  }

  const getUsagePercentage = () => {
    if (!subscription) return 0
    // Use legacy fields if available, otherwise use max_parcelas as primary metric
    if (subscription.hectareasUsadas !== undefined && subscription.hectareasLimite !== undefined) {
      return Math.round((subscription.hectareasUsadas / subscription.hectareasLimite) * 100)
    }
    // For now, we'll use a mock usage percentage until we implement usage tracking
    return 25 // Mock usage
  }

  const isNearLimit = () => {
    return getUsagePercentage() >= 80
  }

  const isOverLimit = () => {
    return getUsagePercentage() >= 100
  }

  return {
    subscription,
    user,
    loading,
    error,
    getPlanDisplayName,
    getPlanColor,
    getUsagePercentage,
    isNearLimit,
    isOverLimit,
    refetch: loadUserSubscription
  }
}