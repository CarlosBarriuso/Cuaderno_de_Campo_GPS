'use client'

import { useState, useEffect } from 'react'
import { PlanCard } from './PlanCard'
import { PlanChangeModal } from './PlanChangeModal'
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

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

export function PlanSelector() {
  const { isAuthReady } = useAuthenticatedApi()
  const { toast } = useToast()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentPlan, setCurrentPlan] = useState<string>('')
  const [currentPlanData, setCurrentPlanData] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)

  useEffect(() => {
    if (isAuthReady) {
      loadPlansAndSubscription()
    }
  }, [isAuthReady])

  const loadPlansAndSubscription = async () => {
    try {
      setLoading(true)
      setError(null)

      const [plansResponse, subscriptionResponse] = await Promise.all([
        api.subscription.plans(),
        api.subscription.current()
      ])

      if (plansResponse?.success && plansResponse.data && Array.isArray(plansResponse.data)) {
        // Ordenar planes: gratuito, básico, profesional, enterprise
        const orderedPlans = plansResponse.data.sort((a, b) => {
          const order = { 'plan_free': 0, 'plan_basic': 1, 'plan_pro': 2, 'plan_enterprise': 3 }
          return (order[a.id] || 999) - (order[b.id] || 999)
        })
        setPlans(orderedPlans)

        // Set current plan data
        if (subscriptionResponse?.success && subscriptionResponse.data) {
          const currentPlanId = subscriptionResponse.data.plan_id
          setCurrentPlan(currentPlanId)
          
          const currentPlanInfo = orderedPlans.find(plan => plan.id === currentPlanId)
          setCurrentPlanData(currentPlanInfo || null)
        }
      }
    } catch (err) {
      console.error('Error loading plans:', err)
      setError('Error al cargar los planes de suscripción')
      toast({
        title: "Error",
        description: "No se pudieron cargar los planes disponibles",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePlanClick = (planId: string) => {
    if (planId === currentPlan) return

    const plan = plans.find(p => p.id === planId)
    if (plan) {
      setSelectedPlan(plan)
      setShowModal(true)
    }
  }

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return

    try {
      setUpgrading(selectedPlan.id)
      
      const response = await api.subscription.upgrade(selectedPlan.id)
      
      if (response?.success) {
        setCurrentPlan(selectedPlan.id)
        setCurrentPlanData(selectedPlan)
        setShowModal(false)
        setSelectedPlan(null)
        
        toast({
          title: "¡Suscripción actualizada!",
          description: `Has cambiado al plan ${response.data.new_plan} exitosamente`,
          variant: "default"
        })
        
        // Recargar datos después del upgrade
        await loadPlansAndSubscription()
      } else {
        throw new Error(response?.error || 'Error al actualizar suscripción')
      }
    } catch (err) {
      console.error('Error upgrading subscription:', err)
      toast({
        title: "Error",
        description: "No se pudo actualizar la suscripción. Inténtalo de nuevo.",
        variant: "destructive"
      })
    } finally {
      setUpgrading(null)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedPlan(null)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Cargando planes disponibles...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={loadPlansAndSubscription}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Elige tu Plan</h2>
        <p className="mt-2 text-lg text-gray-600">
          Selecciona el plan que mejor se adapte a tus necesidades agrícolas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlan={currentPlan}
            currentPlanData={currentPlanData}
            onUpgrade={handlePlanClick}
            isLoading={upgrading === plan.id}
          />
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Todos los planes incluyen actualizaciones gratuitas y soporte técnico.</p>
        <p>Puedes cambiar o cancelar tu plan en cualquier momento.</p>
      </div>

      {/* Plan Change Modal */}
      <PlanChangeModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmUpgrade}
        currentPlan={currentPlanData}
        newPlan={selectedPlan}
        isLoading={upgrading !== null}
      />
    </div>
  )
}