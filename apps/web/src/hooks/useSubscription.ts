'use client'

import { useEffect, useState } from 'react'
import { useAuthenticatedApi } from './useAuthenticatedApi'
import { api } from '@/lib/api'

interface Subscription {
  plan: 'gratuito' | 'basico' | 'profesional' | 'enterprise'
  status: 'active' | 'inactive' | 'cancelled' | 'expired'
  hectareasLimite: number
  hectareasUsadas: number
  fechaInicio: string
  fechaVencimiento: string
  precio: number
  moneda: string
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
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [user, setUser] = useState<UserWithSubscription | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthReady) {
      loadUserSubscription()
    }
  }, [isAuthReady])

  const loadUserSubscription = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Loading user subscription info...')
      
      const response = await api.auth.me()
      console.log('✅ User subscription response:', response)
      
      if (response.success && response.data) {
        setUser(response.data)
        setSubscription(response.data.subscription)
      }
    } catch (error) {
      console.error('❌ Error loading subscription:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getPlanDisplayName = (plan: string) => {
    const planNames = {
      gratuito: 'Plan Gratuito',
      basico: 'Plan Básico',
      profesional: 'Plan Profesional', 
      enterprise: 'Plan Enterprise'
    }
    return planNames[plan] || plan
  }

  const getPlanColor = (plan: string) => {
    const planColors = {
      gratuito: 'bg-gray-100 text-gray-800',
      basico: 'bg-blue-100 text-blue-800',
      profesional: 'bg-green-100 text-green-800',
      enterprise: 'bg-purple-100 text-purple-800'
    }
    return planColors[plan] || 'bg-gray-100 text-gray-800'
  }

  const getUsagePercentage = () => {
    if (!subscription) return 0
    return Math.round((subscription.hectareasUsadas / subscription.hectareasLimite) * 100)
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