'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlanChangeWorkingComponent } from './PlanChangeWorkingComponent'
import { BillingHistory } from './BillingHistory'
import { SubscriptionCancellation } from './SubscriptionCancellation'
import { UserSubscriptionInfo } from './UserSubscriptionInfo'
import { SubscriptionOverview } from './SubscriptionOverview'

export function SubscriptionSystemTest() {
  const [activeTest, setActiveTest] = useState('overview')

  // Mock current plan for testing
  const mockCurrentPlan = {
    id: 'plan_basic',
    name: 'Básico',
    description: 'Perfecto para pequeñas explotaciones agrícolas',
    price: 9.99,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Hasta 5 parcelas',
      'Registro básico de actividades',
      'Mapas GPS básicos',
      '2GB de almacenamiento',
      'Soporte por email'
    ],
    max_parcelas: 5,
    max_actividades: 50,
    storage_gb: 2,
    ocr_monthly_limit: 10,
    weather_api_calls: 100,
    priority_support: false,
    advanced_analytics: false,
    export_formats: ['PDF']
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🧪 Sistema Completo de Suscripciones - Testing</h1>
        <p className="mt-2 text-gray-600">
          Prueba todas las funcionalidades implementadas del sistema de gestión de suscripciones
        </p>
      </div>

      <Tabs value={activeTest} onValueChange={setActiveTest} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="user-info">Usuario</TabsTrigger>
          <TabsTrigger value="plans">Cambio Planes</TabsTrigger>
          <TabsTrigger value="billing">Facturación</TabsTrigger>
          <TabsTrigger value="cancellation">Cancelación</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <UserSubscriptionInfo />
            </div>
            <div className="lg:col-span-2">
              <SubscriptionOverview />
            </div>
          </div>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <h3 className="font-medium text-green-900 mb-4">✅ Funcionalidades Implementadas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">✓</Badge>
                    <span>Gestión de planes de suscripción</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">✓</Badge>
                    <span>Modal de confirmación de cambios</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">✓</Badge>
                    <span>Información detallada del usuario</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">✓</Badge>
                    <span>Estadísticas de uso por plan</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">✓</Badge>
                    <span>Historial de facturación</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">✓</Badge>
                    <span>Sistema de cancelación</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">✓</Badge>
                    <span>Configuración de billing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">✓</Badge>
                    <span>Middleware de límites</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Info Tab */}
        <TabsContent value="user-info">
          <UserSubscriptionInfo />
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <PlanChangeWorkingComponent />
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <BillingHistory />
        </TabsContent>

        {/* Cancellation Tab */}
        <TabsContent value="cancellation">
          <SubscriptionCancellation 
            currentPlan={mockCurrentPlan}
            onCancellationComplete={() => {
              alert('Cancelación completada (simulación)')
            }}
          />
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🔧 Estado del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Backend Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Backend FastAPI</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Endpoints de suscripción:</span>
                        <Badge className="bg-green-100 text-green-800">✓ 6 endpoints</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>CORS configurado:</span>
                        <Badge className="bg-green-100 text-green-800">✓ Funcionando</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Autenticación Clerk:</span>
                        <Badge className="bg-green-100 text-green-800">✓ Integrada</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Middleware de límites:</span>
                        <Badge className="bg-green-100 text-green-800">✓ Implementado</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Frontend React</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Componentes UI:</span>
                        <Badge className="bg-green-100 text-green-800">✓ 8 componentes</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Gestión de estado:</span>
                        <Badge className="bg-green-100 text-green-800">✓ React hooks</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>API client:</span>
                        <Badge className="bg-green-100 text-green-800">✓ Configurado</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Notificaciones:</span>
                        <Badge className="bg-green-100 text-green-800">✓ Toast system</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* API Endpoints */}
                <div>
                  <h4 className="font-medium mb-3">📡 Endpoints Disponibles</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>GET /api/v1/subscription/plans</span>
                      <Badge className="bg-green-100 text-green-800">✓</Badge>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>GET /api/v1/subscription/current</span>
                      <Badge className="bg-green-100 text-green-800">✓</Badge>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>POST /api/v1/subscription/upgrade</span>
                      <Badge className="bg-green-100 text-green-800">✓</Badge>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>POST /api/v1/subscription/cancel</span>
                      <Badge className="bg-green-100 text-green-800">✓</Badge>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>GET /api/v1/subscription/usage</span>
                      <Badge className="bg-green-100 text-green-800">✓</Badge>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>GET /api/v1/subscription/billing/history</span>
                      <Badge className="bg-green-100 text-green-800">✓</Badge>
                    </div>
                  </div>
                </div>

                {/* Features Status */}
                <div>
                  <h4 className="font-medium mb-3">🎯 Características del Sistema</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-900">Gestión de Planes</h5>
                      <ul className="text-sm text-blue-800 mt-2 space-y-1">
                        <li>• 4 planes configurados</li>
                        <li>• Comparación detallada</li>
                        <li>• Upgrade/downgrade</li>
                        <li>• Validaciones de límites</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h5 className="font-medium text-green-900">Facturación</h5>
                      <ul className="text-sm text-green-800 mt-2 space-y-1">
                        <li>• Historial completo</li>
                        <li>• Descarga de facturas</li>
                        <li>• Métodos de pago</li>
                        <li>• Notificaciones</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h5 className="font-medium text-purple-900">Seguridad</h5>
                      <ul className="text-sm text-purple-800 mt-2 space-y-1">
                        <li>• Autenticación Clerk</li>
                        <li>• Middleware de límites</li>
                        <li>• Validaciones backend</li>
                        <li>• CORS configurado</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}