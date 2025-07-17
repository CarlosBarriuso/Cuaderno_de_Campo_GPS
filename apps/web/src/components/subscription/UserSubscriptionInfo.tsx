'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useClerkSubscription } from '@/hooks/useClerkSubscription'
import { useUser } from '@clerk/nextjs'
import { UserIcon, CreditCardIcon, CalendarIcon } from '@heroicons/react/24/outline'

export function UserSubscriptionInfo() {
  const { subscription, loading, error } = useClerkSubscription()
  const { user, isSignedIn, isLoaded } = useUser()

  console.log('🔍 UserSubscriptionInfo Debug:', {
    isSignedIn,
    isLoaded,
    subscription: !!subscription,
    subscriptionData: subscription,
    loading,
    error,
    user: !!user,
    userEmail: user?.emailAddresses[0]?.emailAddress
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatPrice = (price: number, currency: string) => {
    return `${price.toFixed(2)} ${currency}/mes`
  }

  if (loading || !isLoaded) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
            <div className="text-xs text-gray-400 text-center">
              Cargando información de usuario y suscripción...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error al cargar información del usuario: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isSignedIn || !user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Usuario no autenticado
            <div className="text-xs mt-2 text-gray-400">
              isSignedIn: {isSignedIn ? 'Sí' : 'No'} | isLoaded: {isLoaded ? 'Sí' : 'No'}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No hay información de suscripción disponible
            <div className="text-xs mt-2 text-gray-400">
              Loading: {loading ? 'Sí' : 'No'} | Error: {error || 'Ninguno'}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserIcon className="h-5 w-5" />
          <span>Información del Usuario</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Info */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {user?.firstName || 'Usuario'} {user?.lastName || ''}
            </h3>
            <p className="text-gray-600">{user?.emailAddresses[0]?.emailAddress || 'email@ejemplo.com'}</p>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium flex items-center space-x-2">
              <CreditCardIcon className="h-4 w-4" />
              <span>Plan Actual</span>
            </h4>
            <Badge className={subscription.planId === 'free' ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'}>
              {subscription.planName}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Precio</div>
              <div className="font-semibold">
                {subscription.planId === 'free' ? 'Gratis' : 
                 subscription.planId === 'basic' ? '9.99 EUR/mes' :
                 subscription.planId === 'professional' ? '29.99 EUR/mes' :
                 subscription.planId === 'enterprise' ? '99.99 EUR/mes' : 'Gratis'}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">Estado</div>
              <div className="font-semibold">
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                  {subscription.status === 'active' ? 'Activo' : subscription.status}
                </Badge>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Inicio</div>
              <div className="font-semibold text-sm">
                {subscription.currentPeriodStart ? formatDate(subscription.currentPeriodStart.toISOString()) : 'No disponible'}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Renovación</div>
              <div className="font-semibold text-sm">
                {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd.toISOString()) : 'No disponible'}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Summary */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Uso de Parcelas</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Utilizadas</span>
              <span>0 / {subscription.planId === 'free' ? '1' : 
                       subscription.planId === 'basic' ? '5' :
                       subscription.planId === 'professional' ? '25' : 'Ilimitado'} parcelas</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-green-500"
                style={{ width: '0%' }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              0% utilizado
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-t pt-4">
          <div className="flex space-x-2">
            <button 
              onClick={() => window.location.href = '/subscription?tab=plans'}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              Cambiar Plan
            </button>
            <button 
              onClick={() => window.location.href = '/subscription?tab=settings'}
              className="flex-1 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-sm"
            >
              Ver Facturación
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}