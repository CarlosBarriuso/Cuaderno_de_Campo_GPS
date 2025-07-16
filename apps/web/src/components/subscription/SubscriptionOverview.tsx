'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSubscription } from '@/hooks/useSubscription'
import { ChartBarIcon, CreditCardIcon, CalendarIcon } from '@heroicons/react/24/outline'

export function SubscriptionOverview() {
  const { subscription, loading, error, getPlanDisplayName, getPlanColor, getUsagePercentage } = useSubscription()

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
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
            Error al cargar información de suscripción: {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </Button>
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
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activo', variant: 'default' as const },
      canceled: { label: 'Cancelado', variant: 'destructive' as const },
      past_due: { label: 'Pago Pendiente', variant: 'secondary' as const },
      trialing: { label: 'Periodo de Prueba', variant: 'outline' as const }
    }

    const config = statusConfig[status] || { label: status, variant: 'secondary' as const }
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <CreditCardIcon className="h-5 w-5" />
              <span>Estado de Suscripción</span>
            </span>
            {getStatusBadge(subscription.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">Plan Actual</div>
              <div className="font-semibold text-lg">
                <Badge className={getPlanColor(subscription.plan)}>
                  {getPlanDisplayName(subscription.plan)}
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Precio</div>
              <div className="font-semibold">
                {subscription.precio ? `€${subscription.precio}/mes` : 'Gratis'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Estado</div>
              <div className="font-semibold capitalize">
                {subscription.status}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ChartBarIcon className="h-5 w-5" />
            <span>Uso del Plan</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Parcelas Usage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Parcelas</span>
                <span className="text-sm text-gray-600">
                  {subscription.hectareasUsadas || 0} / {subscription.max_parcelas === -1 ? '∞' : subscription.max_parcelas}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    getUsagePercentage() >= 90 ? 'bg-red-500' : 
                    getUsagePercentage() >= 70 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getUsagePercentage()}% utilizado
              </div>
            </div>

            {/* Actividades Usage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Actividades este mes</span>
                <span className="text-sm text-gray-600">
                  0 / {subscription.max_actividades === -1 ? '∞' : subscription.max_actividades}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-green-500" style={{ width: '0%' }}></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">0% utilizado</div>
            </div>

            {/* Storage Usage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Almacenamiento</span>
                <span className="text-sm text-gray-600">
                  0 GB / {subscription.storage_gb} GB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-green-500" style={{ width: '0%' }}></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">0% utilizado</div>
            </div>

            {/* OCR Usage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">OCR este mes</span>
                <span className="text-sm text-gray-600">
                  0 / {subscription.ocr_monthly_limit === -1 ? '∞' : subscription.ocr_monthly_limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-green-500" style={{ width: '0%' }}></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">0% utilizado</div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex space-x-2">
              <Button 
                onClick={() => window.location.href = '/subscription?tab=plans'}
                className="flex-1"
              >
                Cambiar Plan
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/subscription?tab=settings'}
                className="flex-1"
              >
                Ver Facturación
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}