'use client'

import { useEffect, useState } from 'react'
import { useUser, useOrganization } from '@clerk/nextjs'

interface Subscription {
  plan: 'plan_free' | 'plan_basic' | 'plan_pro' | 'plan_enterprise'
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
 * Get plan limits based on plan ID
 */
function getPlanLimits(planId: string) {
  const planLimits = {
    plan_free: {
      max_parcelas: 1,
      max_actividades: 10,
      storage_gb: 0.5,
      ocr_monthly_limit: 5,
      weather_api_calls: 50,
      price: 0
    },
    plan_basic: {
      max_parcelas: 5,
      max_actividades: 50,
      storage_gb: 2,
      ocr_monthly_limit: 10,
      weather_api_calls: 100,
      price: 9.99
    },
    plan_pro: {
      max_parcelas: 25,
      max_actividades: 200,
      storage_gb: 10,
      ocr_monthly_limit: 50,
      weather_api_calls: 500,
      price: 24.99
    },
    plan_enterprise: {
      max_parcelas: -1,
      max_actividades: -1,
      storage_gb: 50,
      ocr_monthly_limit: -1,
      weather_api_calls: -1,
      price: 99.99
    }
  }
  
  return planLimits[planId] || planLimits.plan_free
}

/**
 * Hook para obtener información de suscripción del usuario
 */
export function useSubscription() {
  const { user: clerkUser, isSignedIn, isLoaded } = useUser()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [user, setUser] = useState<UserWithSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔄 useSubscription useEffect triggered:', {
      isLoaded,
      isSignedIn,
      clerkUser: !!clerkUser
    })
    
    if (isLoaded && isSignedIn && clerkUser) {
      loadClerkSubscription()
    } else if (isLoaded && !isSignedIn) {
      // User not signed in, set default free plan
      setDefaultSubscription()
    }
  }, [isLoaded, isSignedIn, clerkUser])

  const loadClerkSubscription = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Loading subscription for user:', clerkUser?.id)
      
      // Try to get subscription data from our API first (in-memory storage)
      try {
        const response = await fetch('/api/clerk/get-subscription')
        if (response.ok) {
          const apiData = await response.json()
          if (apiData.success && apiData.data) {
            console.log('📋 Got subscription from API:', apiData.data)
            const planId = apiData.data.subscriptionPlan || 'plan_free'
            const subscriptionStatus = apiData.data.subscriptionStatus || 'active'
            
            console.log('🎯 API subscription plan:', planId)
            
            const planLimits = getPlanLimits(planId)
            
            const apiSubscription: Subscription = {
              plan: planId,
              status: subscriptionStatus,
              max_parcelas: planLimits.max_parcelas,
              max_actividades: planLimits.max_actividades,
              storage_gb: planLimits.storage_gb,
              ocr_monthly_limit: planLimits.ocr_monthly_limit,
              weather_api_calls: planLimits.weather_api_calls,
              priority_support: planId !== 'plan_free',
              advanced_analytics: ['plan_pro', 'plan_enterprise'].includes(planId),
              export_formats: planId === 'plan_free' ? ['PDF'] : ['PDF', 'CSV', 'Excel'],
              user_id: clerkUser?.id,
              user_email: clerkUser?.emailAddresses[0]?.emailAddress,
              user_name: clerkUser?.firstName || clerkUser?.emailAddresses[0]?.emailAddress,
              hectareasLimite: planLimits.max_parcelas,
              hectareasUsadas: 0,
              precio: planLimits.price,
              moneda: 'EUR',
              fechaInicio: apiData.data.subscriptionStart || new Date().toISOString(),
              fechaVencimiento: apiData.data.subscriptionEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
            
            console.log('🎯 API subscription loaded:', apiSubscription)
            setSubscription(apiSubscription)
            setLoading(false)
            return
          }
        }
      } catch (apiError) {
        console.log('⚠️ API fetch failed, falling back to Clerk metadata:', apiError)
      }
      
      // Fallback to Clerk metadata if API fails
      const userMetadata = clerkUser?.publicMetadata || {}
      const privateMetadata = clerkUser?.privateMetadata || {}
      
      console.log('📋 User metadata fallback:', { userMetadata, privateMetadata })
      
      let planId = userMetadata.subscriptionPlan || privateMetadata.subscriptionPlan || 'plan_free'
      const subscriptionStatus = userMetadata.subscriptionStatus || privateMetadata.subscriptionStatus || 'active'
      
      console.log('🎯 Clerk subscription plan:', planId)
      
      const planLimits = getPlanLimits(planId)
      
      const clerkSubscription: Subscription = {
        plan: planId,
        status: subscriptionStatus,
        max_parcelas: planLimits.max_parcelas,
        max_actividades: planLimits.max_actividades,
        storage_gb: planLimits.storage_gb,
        ocr_monthly_limit: planLimits.ocr_monthly_limit,
        weather_api_calls: planLimits.weather_api_calls,
        priority_support: planId !== 'plan_free',
        advanced_analytics: ['plan_pro', 'plan_enterprise'].includes(planId),
        export_formats: planId === 'plan_free' ? ['PDF'] : ['PDF', 'CSV', 'Excel'],
        user_id: clerkUser?.id,
        user_email: clerkUser?.emailAddresses[0]?.emailAddress,
        user_name: clerkUser?.firstName || clerkUser?.emailAddresses[0]?.emailAddress,
        // Legacy fields for backward compatibility
        hectareasLimite: planLimits.max_parcelas,
        hectareasUsadas: 0, // TODO: Get real usage from our backend
        precio: planLimits.price,
        moneda: 'EUR',
        fechaInicio: userMetadata.subscriptionStart || new Date().toISOString(),
        fechaVencimiento: userMetadata.subscriptionEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      console.log('🎯 Clerk subscription loaded:', clerkSubscription)
      setSubscription(clerkSubscription)
      
    } catch (error) {
      console.error('❌ Error loading Clerk subscription:', error)
      setError(error?.message || 'Error loading subscription')
      setDefaultSubscription()
    } finally {
      setLoading(false)
    }
  }
  
  const setDefaultSubscription = () => {
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
    setLoading(false)
  }

  const getPlanDisplayName = (plan: string) => {
    const planNames = {
      plan_free: 'Gratuito',
      plan_basic: 'Básico',
      plan_pro: 'Profesional', 
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
      plan_pro: 'bg-green-100 text-green-800',
      plan_enterprise: 'bg-purple-100 text-purple-800',
      // Legacy support
      gratuito: 'bg-gray-100 text-gray-800',
      basico: 'bg-blue-100 text-blue-800',
      profesional: 'bg-green-100 text-green-800',
      enterprise: 'bg-purple-100 text-purple-800'
    }
    return planColors[plan] || 'bg-gray-100 text-gray-800'
  }

  const getPlanColorHeader = (plan: string) => {
    const planColors = {
      plan_free: 'bg-gray-500/20 text-gray-200 border-gray-400/30',
      plan_basic: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
      plan_pro: 'bg-green-500/20 text-green-200 border-green-400/30',
      plan_enterprise: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
      // Legacy support
      gratuito: 'bg-gray-500/20 text-gray-200 border-gray-400/30',
      basico: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
      profesional: 'bg-green-500/20 text-green-200 border-green-400/30',
      enterprise: 'bg-purple-500/20 text-purple-200 border-purple-400/30'
    }
    return planColors[plan] || 'bg-gray-500/20 text-gray-200 border-gray-400/30'
  }

  const getPlanIcon = (plan: string) => {
    const planIcons = {
      plan_free: '🆓',
      plan_basic: '📊',
      plan_pro: '🚀',
      plan_enterprise: '💎',
      // Legacy support
      gratuito: '🆓',
      basico: '📊',
      profesional: '🚀',
      enterprise: '💎'
    }
    return planIcons[plan] || '📋'
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

  const getAvailablePlans = () => {
    return [
      {
        id: 'plan_free',
        name: 'Gratuito',
        description: 'Perfecto para empezar',
        price: 0,
        currency: 'EUR',
        interval: 'mes',
        features: ['1 parcela', '10 actividades/mes', '500 MB almacenamiento', '5 análisis OCR/mes'],
        max_parcelas: 1,
        max_actividades: 10,
        storage_gb: 0.5,
        ocr_monthly_limit: 5,
        weather_api_calls: 50,
        priority_support: false,
        advanced_analytics: false,
        export_formats: ['PDF']
      },
      {
        id: 'plan_basic',
        name: 'Básico',
        description: 'Para pequeños productores',
        price: 9.99,
        currency: 'EUR',
        interval: 'mes',
        features: ['5 parcelas', '50 actividades/mes', '2 GB almacenamiento', '10 análisis OCR/mes'],
        max_parcelas: 5,
        max_actividades: 50,
        storage_gb: 2,
        ocr_monthly_limit: 10,
        weather_api_calls: 100,
        priority_support: false,
        advanced_analytics: false,
        export_formats: ['PDF']
      },
      {
        id: 'plan_pro',
        name: 'Profesional',
        description: 'Para productores medianos',
        price: 24.99,
        currency: 'EUR',
        interval: 'mes',
        features: ['25 parcelas', 'Actividades ilimitadas', '10 GB almacenamiento', '100 análisis OCR/mes', 'Analíticas avanzadas'],
        max_parcelas: 25,
        max_actividades: -1,
        storage_gb: 10,
        ocr_monthly_limit: 100,
        weather_api_calls: 1000,
        priority_support: true,
        advanced_analytics: true,
        export_formats: ['PDF', 'Excel', 'CSV']
      },
      {
        id: 'plan_enterprise',
        name: 'Enterprise',
        description: 'Para grandes explotaciones',
        price: 99.99,
        currency: 'EUR',
        interval: 'mes',
        features: ['Parcelas ilimitadas', 'Actividades ilimitadas', '50 GB almacenamiento', 'OCR ilimitado', 'Soporte prioritario'],
        max_parcelas: -1,
        max_actividades: -1,
        storage_gb: 50,
        ocr_monthly_limit: -1,
        weather_api_calls: -1,
        priority_support: true,
        advanced_analytics: true,
        export_formats: ['PDF', 'CSV', 'Excel', 'JSON']
      }
    ]
  }

  return {
    subscription,
    user,
    loading,
    error,
    getPlanDisplayName,
    getPlanColor,
    getPlanColorHeader,
    getPlanIcon,
    getUsagePercentage,
    isNearLimit,
    isOverLimit,
    getAvailablePlans,
    refetch: loadClerkSubscription,
    upgradeSubscription: upgradeToClerkPlan
  }
}

// Function to upgrade subscription using Clerk
const upgradeToClerkPlan = async (planId: string) => {
  try {
    console.log('🔄 Upgrading to Clerk plan:', planId)
    
    // This would typically redirect to Clerk's billing portal
    // For now, we'll update the user metadata directly
    const response = await fetch('/api/clerk/update-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId })
    })
    
    if (response.ok) {
      return { success: true }
    } else {
      throw new Error('Failed to upgrade subscription')
    }
  } catch (error) {
    console.error('Error upgrading subscription:', error)
    throw error
  }
}