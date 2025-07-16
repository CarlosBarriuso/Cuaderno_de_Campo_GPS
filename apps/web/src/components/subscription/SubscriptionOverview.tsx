'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi'
import { api } from '@/lib/api'

interface SubscriptionUsage {
  current_plan: string
  usage: {
    parcelas: { used: number; limit: number; percentage: number }
    actividades: { used: number; limit: number; percentage: number }
    storage: { used_gb: number; limit_gb: number; percentage: number }
    ocr_calls: { used: number; limit: number; percentage: number }
    weather_calls: { used: number; limit: number; percentage: number }
  }
  period: {
    start: string
    end: string
  }
}

interface SubscriptionData {
  plan_id: string
  plan_name: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
}

export function SubscriptionOverview() {
  const { isAuthReady } = useAuthenticatedApi()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthReady) {
      loadSubscriptionData()
    }
  }, [isAuthReady])

  const loadSubscriptionData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [subscriptionResponse, usageResponse] = await Promise.all([
        api.subscription.current(),
        api.subscription.usage()
      ])

      if (subscriptionResponse.success) {
        setSubscription(subscriptionResponse.data)
      }

      if (usageResponse.success) {
        setUsage(usageResponse.data)
      }
    } catch (err) {
      console.error('Error loading subscription data:', err)
      setError('Error al cargar información de suscripción')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activo', variant: 'success' as const },
      canceled: { label: 'Cancelado', variant: 'destructive' as const },
      past_due: { label: 'Pago Pendiente', variant: 'warning' as const },
      trialing: { label: 'Periodo de Prueba', variant: 'info' as const }
    }

    const config = statusConfig[status] || { label: status, variant: 'secondary' as const }
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando información de suscripción...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">{error}</div>
          <Button 
            onClick={loadSubscriptionData} 
            variant="outline" 
            className="mt-4 mx-auto block"
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Estado de Suscripción</span>
              {getStatusBadge(subscription.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">Plan Actual</div>
                <div className="font-semibold">{subscription.plan_name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Inicio del Periodo</div>
                <div className="font-semibold">
                  {formatDate(subscription.current_period_start)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Fin del Periodo</div>
                <div className="font-semibold">
                  {formatDate(subscription.current_period_end)}
                </div>
              </div>
            </div>
            
            {subscription.cancel_at_period_end && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-sm text-yellow-800">
                  ⚠️ Tu suscripción será cancelada al final del periodo actual
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Statistics */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle>Uso del Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Parcelas */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Parcelas</span>
                  <span>
                    {usage.usage.parcelas.used} / {usage.usage.parcelas.limit === -1 ? '∞' : usage.usage.parcelas.limit}
                  </span>
                </div>
                <Progress 
                  value={usage.usage.parcelas.percentage} 
                  className="h-2"
                />
              </div>

              {/* Actividades */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Actividades</span>
                  <span>
                    {usage.usage.actividades.used} / {usage.usage.actividades.limit === -1 ? '∞' : usage.usage.actividades.limit}
                  </span>
                </div>
                <Progress 
                  value={usage.usage.actividades.percentage} 
                  className="h-2"
                />
              </div>

              {/* Storage */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Almacenamiento</span>
                  <span>
                    {usage.usage.storage.used_gb.toFixed(1)} GB / {usage.usage.storage.limit_gb} GB
                  </span>
                </div>
                <Progress 
                  value={usage.usage.storage.percentage} 
                  className="h-2"
                />
              </div>

              {/* OCR Calls */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>OCR (mes actual)</span>
                  <span>
                    {usage.usage.ocr_calls.used} / {usage.usage.ocr_calls.limit === -1 ? '∞' : usage.usage.ocr_calls.limit}
                  </span>
                </div>
                <Progress 
                  value={usage.usage.ocr_calls.percentage} 
                  className="h-2"
                />
              </div>

              {/* Weather API Calls */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Consultas Meteorológicas</span>
                  <span>
                    {usage.usage.weather_calls.used} / {usage.usage.weather_calls.limit === -1 ? '∞' : usage.usage.weather_calls.limit}
                  </span>
                </div>
                <Progress 
                  value={usage.usage.weather_calls.percentage} 
                  className="h-2"
                />
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Periodo: {formatDate(usage.period.start)} - {formatDate(usage.period.end)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}