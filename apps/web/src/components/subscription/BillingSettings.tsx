'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BillingHistory } from './BillingHistory'
import { SubscriptionCancellation } from './SubscriptionCancellation'
import { 
  CreditCardIcon,
  DocumentTextIcon,
  CogIcon,
  BellIcon
} from '@heroicons/react/24/outline'

interface BillingSettingsProps {
  currentPlan?: any
}

export function BillingSettings({ currentPlan }: BillingSettingsProps) {
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: '1',
      type: 'card',
      brand: 'visa',
      last4: '4242',
      expiry: '12/27',
      isDefault: true
    }
  ])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="methods" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="methods" className="flex items-center space-x-2">
            <CreditCardIcon className="h-4 w-4" />
            <span>Métodos de Pago</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <DocumentTextIcon className="h-4 w-4" />
            <span>Historial</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <BellIcon className="h-4 w-4" />
            <span>Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="cancellation" className="flex items-center space-x-2">
            <CogIcon className="h-4 w-4" />
            <span>Cancelación</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="space-y-6">
          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCardIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p>No hay métodos de pago configurados</p>
                    <p className="text-sm">Añade una tarjeta para gestionar tu suscripción</p>
                  </div>
                ) : (
                  paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {method.brand.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">
                            •••• •••• •••• {method.last4}
                          </div>
                          <div className="text-sm text-gray-600">
                            Expira {method.expiry}
                          </div>
                        </div>
                        {method.isDefault && (
                          <Badge className="bg-green-100 text-green-800">Por defecto</Badge>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        <Button variant="outline" size="sm">
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                
                <Button className="w-full" variant="outline">
                  <CreditCardIcon className="h-4 w-4 mr-2" />
                  Añadir Método de Pago
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Billing Address */}
          <Card>
            <CardHeader>
              <CardTitle>Dirección de Facturación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium">Juan Pérez</div>
                  <div className="text-sm text-gray-600">
                    Calle Mayor 123<br />
                    28001 Madrid, España<br />
                    +34 600 123 456
                  </div>
                </div>
                <Button variant="outline">
                  Actualizar Dirección
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <BillingHistory />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          {/* Billing Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones de Facturación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Facturas por email</div>
                    <div className="text-sm text-gray-600">
                      Recibe un email cuando se genere una nueva factura
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-4 h-4 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Recordatorios de pago</div>
                    <div className="text-sm text-gray-600">
                      Notificaciones antes del vencimiento de pagos
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-4 h-4 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Límites de uso</div>
                    <div className="text-sm text-gray-600">
                      Alertas cuando te acerques a los límites de tu plan
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-4 h-4 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Cambios en la suscripción</div>
                    <div className="text-sm text-gray-600">
                      Confirmaciones de cambios de plan y cancelaciones
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-4 h-4 text-blue-600"
                  />
                </div>

                <Button>
                  Guardar Preferencias
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Uso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Alerta al 80% de uso</div>
                    <div className="text-sm text-gray-600">
                      Te avisamos cuando uses el 80% de tus límites
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-4 h-4 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Alerta al 95% de uso</div>
                    <div className="text-sm text-gray-600">
                      Aviso crítico antes de alcanzar el límite
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-4 h-4 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sugerencias de upgrade</div>
                    <div className="text-sm text-gray-600">
                      Recomendaciones de plan basadas en tu uso
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-4 h-4 text-blue-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancellation">
          <SubscriptionCancellation 
            currentPlan={currentPlan}
            onCancellationComplete={() => {
              // Handle cancellation completion
              console.log('Subscription cancelled')
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}