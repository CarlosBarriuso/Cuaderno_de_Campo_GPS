'use client'

import { useUser } from '@clerk/nextjs'
import { useSubscription } from '@/hooks/useSubscription'
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
    error, 
    getPlanDisplayName, 
    getPlanColor, 
    getUsagePercentage 
  } = useSubscription()

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
              <span className="font-medium">{subscription?.user_name || user?.firstName || 'Usuario'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-xs">{subscription?.user_email || user?.emailAddresses[0]?.emailAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ID:</span>
              <span className="font-mono text-xs text-gray-500">{subscription?.user_id || user?.id}</span>
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
                <Badge className={`${getPlanColor(subscription.plan)} text-sm`}>
                  {getPlanDisplayName(subscription.plan)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Estado:</span>
                <Badge className="bg-green-100 text-green-800 text-xs">
                  {subscription.status === 'active' ? 'Activo' : subscription.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Precio:</span>
                <span className="font-medium">
                  {subscription.precio ? `€${subscription.precio}/mes` : 'Gratis'}
                </span>
              </div>

              {/* Usage Information */}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Uso de parcelas:</span>
                  <span className="text-sm font-medium">
                    {subscription.hectareasUsadas || 0}/{subscription.hectareasLimite || subscription.max_parcelas}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getUsagePercentage()}% utilizado
                </div>
              </div>
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