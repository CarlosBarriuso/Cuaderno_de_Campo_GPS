'use client'

import { useUser } from '@clerk/nextjs'
import { useClerkSubscription } from '@/hooks/useClerkSubscription'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  CreditCardIcon, 
  UserIcon, 
  CalendarIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline'

export function UserPlanCard() {
  const { user } = useUser()
  const { 
    subscription, 
    loading, 
    error
  } = useClerkSubscription()

  // Helper functions for plan display
  const getPlanDisplayName = (planId: string) => {
    const planNames = {
      'free': 'Gratuito',
      'basic': 'Básico', 
      'professional': 'Profesional',
      'enterprise': 'Enterprise'
    }
    return planNames[planId as keyof typeof planNames] || 'Gratuito'
  }

  const getPlanColor = (planId: string) => {
    const colors = {
      'free': 'bg-gray-100 text-gray-800',
      'basic': 'bg-blue-100 text-blue-800',
      'professional': 'bg-green-100 text-green-800', 
      'enterprise': 'bg-purple-100 text-purple-800'
    }
    return colors[planId as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600 text-sm">
            Error cargando información de suscripción: {error}
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
          <span>Mi Cuenta</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Information */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Información Personal</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Nombre:</span>
              <span className="font-medium">{user?.firstName || 'Usuario'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-xs">{user?.emailAddresses[0]?.emailAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ID:</span>
              <span className="font-mono text-xs text-gray-500">{user?.id}</span>
            </div>
          </div>
        </div>

        {/* Plan Information */}
        {subscription && (
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Plan Actual</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Plan:</span>
                <Badge className={`${getPlanColor(subscription.planId)} text-sm`}>
                  {getPlanDisplayName(subscription.planId)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Estado:</span>
                <Badge className="bg-green-100 text-green-800 text-xs">
                  {subscription.status === 'active' ? 'Activo' : subscription.status}
                </Badge>
              </div>

              {subscription.currentPeriodStart && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Inicio del período:</span>
                  <span className="text-sm font-medium">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {subscription.currentPeriodEnd && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Renovación:</span>
                  <span className="text-sm font-medium">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {subscription.cancelAtPeriodEnd && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Cancelación:</span>
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                    Se cancela al final del período
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-1 gap-2">
            <Link href="/subscription">
              <Button className="w-full justify-start" variant="outline">
                <CreditCardIcon className="h-4 w-4 mr-2" />
                Gestionar Suscripción
              </Button>
            </Link>
            
            <Link href="/subscription/complete-test">
              <Button className="w-full justify-start" variant="outline">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Panel de Pruebas
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}