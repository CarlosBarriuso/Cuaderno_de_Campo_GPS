'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: string
  features: string[]
  max_parcelas: number
  max_actividades: number
  storage_gb: number
  ocr_monthly_limit: number
  weather_api_calls: number
  priority_support: boolean
  advanced_analytics: boolean
  export_formats: string[]
}

interface PlanChangeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  currentPlan?: SubscriptionPlan
  newPlan?: SubscriptionPlan
  isLoading?: boolean
}

export function PlanChangeModal({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  newPlan,
  isLoading = false
}: PlanChangeModalProps) {
  
  if (!currentPlan || !newPlan) return null

  const isUpgrade = newPlan.price > currentPlan.price
  const isDowngrade = newPlan.price < currentPlan.price
  const isSamePlan = newPlan.id === currentPlan.id

  const formatPrice = (price: number, currency: string, interval: string) => {
    if (price === 0) return 'Gratis'
    return `${price.toFixed(2)} ${currency}/${interval === 'month' ? 'mes' : 'año'}`
  }

  const getPriceDifference = () => {
    const diff = newPlan.price - currentPlan.price
    if (diff === 0) return null
    
    return {
      amount: Math.abs(diff),
      type: diff > 0 ? 'increase' : 'decrease',
      currency: newPlan.currency
    }
  }

  const priceDiff = getPriceDifference()

  if (isSamePlan) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan Actual</DialogTitle>
            <DialogDescription>
              Ya tienes el plan {newPlan.name} activo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isUpgrade ? (
              <CheckIcon className="h-5 w-5 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
            )}
            <span>
              {isUpgrade ? 'Actualizar Plan' : 'Cambiar Plan'}
            </span>
          </DialogTitle>
          <DialogDescription>
            Confirma el cambio de tu plan de suscripción
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Plan */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="text-sm text-gray-500 mb-2">Plan Actual</div>
              <h3 className="font-semibold text-lg">{currentPlan.name}</h3>
              <div className="text-sm text-gray-600 mb-2">{currentPlan.description}</div>
              <div className="font-medium text-lg">
                {formatPrice(currentPlan.price, currentPlan.currency, currentPlan.interval)}
              </div>
            </div>

            {/* New Plan */}
            <div className={`border rounded-lg p-4 ${
              isUpgrade ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="text-sm text-gray-500 mb-2">Nuevo Plan</div>
              <h3 className="font-semibold text-lg">{newPlan.name}</h3>
              <div className="text-sm text-gray-600 mb-2">{newPlan.description}</div>
              <div className="font-medium text-lg">
                {formatPrice(newPlan.price, newPlan.currency, newPlan.interval)}
              </div>
              {priceDiff && (
                <Badge className={`mt-2 ${
                  isUpgrade ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {priceDiff.type === 'increase' ? '+' : '-'}
                  {priceDiff.amount.toFixed(2)} {priceDiff.currency}/mes
                </Badge>
              )}
            </div>
          </div>

          {/* Feature Comparison */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Comparación de Características</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700 mb-2">Límites del Plan</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Parcelas:</span>
                    <span>
                      {currentPlan.max_parcelas === -1 ? 'Ilimitadas' : currentPlan.max_parcelas} → {' '}
                      <span className={isUpgrade ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                        {newPlan.max_parcelas === -1 ? 'Ilimitadas' : newPlan.max_parcelas}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Actividades:</span>
                    <span>
                      {currentPlan.max_actividades === -1 ? 'Ilimitadas' : currentPlan.max_actividades} → {' '}
                      <span className={isUpgrade ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                        {newPlan.max_actividades === -1 ? 'Ilimitadas' : newPlan.max_actividades}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Almacenamiento:</span>
                    <span>
                      {currentPlan.storage_gb}GB → {' '}
                      <span className={isUpgrade ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                        {newPlan.storage_gb}GB
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="font-medium text-gray-700 mb-2">Funcionalidades Adicionales</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Soporte prioritario:</span>
                    <span>
                      {currentPlan.priority_support ? '✅' : '❌'} → {' '}
                      <span className={newPlan.priority_support ? 'text-green-600' : 'text-gray-400'}>
                        {newPlan.priority_support ? '✅' : '❌'}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Analytics avanzados:</span>
                    <span>
                      {currentPlan.advanced_analytics ? '✅' : '❌'} → {' '}
                      <span className={newPlan.advanced_analytics ? 'text-green-600' : 'text-gray-400'}>
                        {newPlan.advanced_analytics ? '✅' : '❌'}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Formatos de exportación:</span>
                    <span>
                      {currentPlan.export_formats.length} → {' '}
                      <span className={newPlan.export_formats.length >= currentPlan.export_formats.length ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                        {newPlan.export_formats.length}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className={`p-4 rounded-lg ${
            isUpgrade ? 'bg-blue-50 border border-blue-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <h4 className="font-medium mb-2">
              {isUpgrade ? 'ℹ️ Información importante' : '⚠️ Información importante'}
            </h4>
            <ul className="text-sm space-y-1">
              {isUpgrade ? (
                <>
                  <li>• El cambio será efectivo inmediatamente</li>
                  <li>• Se aplicará un prorrateo por el tiempo restante del periodo actual</li>
                  <li>• Tendrás acceso a todas las nuevas funcionalidades al instante</li>
                  <li>• El próximo cobro será por el nuevo plan completo</li>
                </>
              ) : (
                <>
                  <li>• El cambio será efectivo al final del periodo actual</li>
                  <li>• Mantendrás el acceso completo hasta la fecha de renovación</li>
                  <li>• Algunas funcionalidades pueden quedar limitadas después del cambio</li>
                  <li>• No se aplicarán reembolsos por el tiempo restante</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isLoading}
            className={isUpgrade ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}
          >
            {isLoading ? 'Procesando...' : `Confirmar ${isUpgrade ? 'Actualización' : 'Cambio'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}