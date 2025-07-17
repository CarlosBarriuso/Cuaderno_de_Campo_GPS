'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { 
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckIcon 
} from '@heroicons/react/24/outline'

interface SubscriptionCancellationProps {
  currentPlan?: any
  onCancellationComplete?: () => void
}

export function SubscriptionCancellation({ 
  currentPlan, 
  onCancellationComplete 
}: SubscriptionCancellationProps) {
  const { isAuthReady } = useAuthenticatedApi()
  const { toast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [selectedReason, setSelectedReason] = useState('')
  const [feedback, setFeedback] = useState('')

  const cancellationReasons = [
    'Demasiado caro',
    'No uso todas las funcionalidades',
    'Encontré una alternativa mejor',
    'Problemas técnicos',
    'Ya no necesito el servicio',
    'Funcionalidades insuficientes',
    'Soporte deficiente',
    'Otro motivo'
  ]

  const handleCancellation = async () => {
    if (!selectedReason) {
      toast({
        title: "Motivo requerido",
        description: "Por favor selecciona un motivo para la cancelación",
        variant: "destructive"
      })
      return
    }

    try {
      setCancelling(true)
      
      const response = await api.subscription.cancel()
      
      if (response?.success) {
        toast({
          title: "Suscripción cancelada",
          description: "Tu suscripción ha sido cancelada. Mantendrás acceso hasta el final del periodo actual.",
          variant: "default"
        })
        
        setShowModal(false)
        onCancellationComplete?.()
      } else {
        throw new Error(response?.error || 'Error al cancelar suscripción')
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err)
      toast({
        title: "Error",
        description: "No se pudo cancelar la suscripción. Inténtalo de nuevo.",
        variant: "destructive"
      })
    } finally {
      setCancelling(false)
    }
  }

  const isPaidPlan = currentPlan?.price > 0

  return (
    <>
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-900">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>Cancelar Suscripción</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">
                ⚠️ Información importante sobre la cancelación
              </h4>
              <ul className="text-sm text-red-800 space-y-1">
                {isPaidPlan ? (
                  <>
                    <li>• Tu suscripción se cancelará al final del periodo actual</li>
                    <li>• Mantendrás acceso completo hasta la fecha de renovación</li>
                    <li>• No se aplicarán reembolsos por el tiempo restante</li>
                    <li>• Podrás reactivar tu suscripción en cualquier momento</li>
                  </>
                ) : (
                  <>
                    <li>• Tu plan gratuito se mantendrá activo</li>
                    <li>• No perderás acceso a las funcionalidades básicas</li>
                    <li>• Podrás actualizar a un plan de pago cuando quieras</li>
                  </>
                )}
              </ul>
            </div>

            {currentPlan && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Plan Actual: {currentPlan.name}</div>
                  <div className="text-sm text-gray-600">
                    {isPaidPlan 
                      ? `${currentPlan.price} EUR/mes`
                      : 'Plan gratuito'
                    }
                  </div>
                </div>
                <Badge variant={isPaidPlan ? 'default' : 'secondary'}>
                  {isPaidPlan ? 'Plan de Pago' : 'Plan Gratuito'}
                </Badge>
              </div>
            )}

            <div className="pt-4">
              <Button
                onClick={() => setShowModal(true)}
                variant="destructive"
                disabled={!isAuthReady}
                className="w-full"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                {isPaidPlan ? 'Cancelar Suscripción de Pago' : 'Cancelar Cuenta'}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                ¿Tienes problemas? <a href="#" className="text-blue-600 hover:underline">Contacta con soporte</a> antes de cancelar
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-900">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span>Confirmar Cancelación</span>
            </DialogTitle>
            <DialogDescription>
              Ayúdanos a mejorar contándonos por qué cancelas tu suscripción
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">
                ¿Cuál es el motivo principal de tu cancelación? *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {cancellationReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`p-3 text-left border rounded-lg transition-all ${
                      selectedReason === reason
                        ? 'border-red-500 bg-red-50 text-red-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {selectedReason === reason && (
                        <CheckIcon className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">{reason}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Comentarios adicionales (opcional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Comparte cualquier comentario que pueda ayudarnos a mejorar..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24"
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {feedback.length}/500 caracteres
              </div>
            </div>

            {/* Current Plan Info */}
            {currentPlan && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">
                  Perderás acceso a:
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• {currentPlan.max_parcelas === -1 ? 'Parcelas ilimitadas' : `Hasta ${currentPlan.max_parcelas} parcelas`}</li>
                  <li>• {currentPlan.max_actividades === -1 ? 'Actividades ilimitadas' : `Hasta ${currentPlan.max_actividades} actividades/mes`}</li>
                  <li>• {currentPlan.storage_gb}GB de almacenamiento</li>
                  {currentPlan.priority_support && <li>• Soporte prioritario</li>}
                  {currentPlan.advanced_analytics && <li>• Analytics avanzados</li>}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setShowModal(false)} 
              variant="outline"
              disabled={cancelling}
            >
              Mantener Suscripción
            </Button>
            <Button 
              onClick={handleCancellation}
              variant="destructive"
              disabled={cancelling || !selectedReason}
            >
              {cancelling ? 'Cancelando...' : 'Confirmar Cancelación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}