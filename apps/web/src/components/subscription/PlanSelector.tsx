'use client'

import { useState, useEffect } from 'react'
import { PlanCard } from './PlanCard'
import { PlanChangeModal } from './PlanChangeModal'
import { useSubscription } from '@/hooks/useSubscription'
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
  const subscriptionResult = useSubscription()
  const { toast } = useToast()
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [backendPlans, setBackendPlans] = useState<SubscriptionPlan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)

  // Use static plan data to avoid API issues
  const staticPlans: SubscriptionPlan[] = [
    {
      id: 'plan_free',
      name: 'Gratuito',
      description: 'Perfecto para empezar',
      price: 0,
      currency: 'EUR',
      interval: 'mes',
      features: ['1 parcela', '10 actividades/mes', '500 MB almacenamiento', '5 análisis OCR/mes'],
      max_parcelas: 1,
      max_actividades: 10,
      storage_gb: 0.5,
      ocr_monthly_limit: 5,
      weather_api_calls: 50,
      priority_support: false,
      advanced_analytics: false,
      export_formats: ['PDF']
    },
    {
      id: 'plan_basic',
      name: 'Básico',
      description: 'Para pequeños productores',
      price: 9.99,
      currency: 'EUR',
      interval: 'mes',
      features: ['5 parcelas', '50 actividades/mes', '2 GB almacenamiento', '10 análisis OCR/mes'],
      max_parcelas: 5,
      max_actividades: 50,
      storage_gb: 2,
      ocr_monthly_limit: 10,
      weather_api_calls: 100,
      priority_support: false,
      advanced_analytics: false,
      export_formats: ['PDF']
    },
    {
      id: 'plan_pro',
      name: 'Profesional',
      description: 'Para productores medianos',
      price: 24.99,
      currency: 'EUR',
      interval: 'mes',
      features: ['25 parcelas', 'Actividades ilimitadas', '10 GB almacenamiento', '100 análisis OCR/mes', 'Analíticas avanzadas'],
      max_parcelas: 25,
      max_actividades: -1,
      storage_gb: 10,
      ocr_monthly_limit: 100,
      weather_api_calls: 1000,
      priority_support: true,
      advanced_analytics: true,
      export_formats: ['PDF', 'Excel', 'CSV']
    },
    {
      id: 'plan_enterprise',
      name: 'Enterprise',
      description: 'Para grandes explotaciones',
      price: 99.99,
      currency: 'EUR',
      interval: 'mes',
      features: ['Parcelas ilimitadas', 'Actividades ilimitadas', '50 GB almacenamiento', 'OCR ilimitado', 'Soporte prioritario'],
      max_parcelas: -1,
      max_actividades: -1,
      storage_gb: 50,
      ocr_monthly_limit: -1,
      weather_api_calls: -1,
      priority_support: true,
      advanced_analytics: true,
      export_formats: ['PDF', 'CSV', 'Excel', 'JSON']
    }
  ]

  // Safely extract values with fallbacks
  const subscription = subscriptionResult?.subscription
  const loading = subscriptionResult?.loading || false
  const getPlanDisplayName = subscriptionResult?.getPlanDisplayName || (() => 'Plan')
  const getPlanColor = subscriptionResult?.getPlanColor || (() => 'bg-gray-100 text-gray-800')
  const refetch = subscriptionResult?.refetch

  // Load plans from backend on component mount
  useEffect(() => {
    const loadPlansFromBackend = async () => {
      try {
        setLoadingPlans(true)
        const { api } = await import('@/lib/api')
        const response = await api.subscription.plans()
        console.log('📋 Backend plans response:', response)
        
        if (response && response.success && response.data && Array.isArray(response.data)) {
          setBackendPlans(response.data)
        } else {
          console.log('📋 Using static plans as fallback')
        }
      } catch (error) {
        console.error('❌ Error loading plans from backend:', error)
        console.log('📋 Using static plans as fallback')
      } finally {
        setLoadingPlans(false)
      }
    }
    
    loadPlansFromBackend()
  }, [])

  // Use backend plans if available, otherwise fallback to static
  const plans = backendPlans.length > 0 ? backendPlans : staticPlans
  const currentPlan = subscription?.plan || 'plan_free'
  const currentPlanData = plans.find(plan => plan.id === currentPlan)

  console.log('🔍 PlanSelector Debug:', {
    subscription,
    currentPlan,
    loading,
    loadingPlans,
    plansCount: plans.length,
    backendPlansCount: backendPlans.length,
    subscriptionResult: !!subscriptionResult
  })

  const handlePlanClick = (planId: string) => {
    console.log('🎯 Plan clicked:', planId, 'Current plan:', currentPlan)
    
    if (planId === currentPlan) {
      console.log('⚠️ Same plan clicked, ignoring')
      return
    }

    const plan = plans.find(p => p.id === planId)
    console.log('📋 Found plan:', plan)
    
    if (plan) {
      console.log('✅ Setting selected plan and showing modal')
      setSelectedPlan(plan)
      setShowModal(true)
    } else {
      console.error('❌ Plan not found:', planId)
    }
  }

  const handleConfirmUpgrade = async () => {
    console.log('🚀 handleConfirmUpgrade called with selectedPlan:', selectedPlan)
    
    if (!selectedPlan) {
      console.error('❌ No selectedPlan available')
      return
    }

    try {
      setUpgrading(selectedPlan.id)
      
      console.log('🔄 Upgrading to Clerk plan:', selectedPlan.id)
      
      // Call our Clerk API route to update subscription
      console.log('📤 Making API call to Clerk subscription endpoint...')
      const response = await fetch('/api/clerk/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: selectedPlan.id })
      })
      
      const responseData = await response.json()
      console.log('✅ Clerk response:', responseData)
      console.log('✅ Response status:', response.status)
      
      if (response.ok && responseData && responseData.success) {
        toast({
          title: "¡Suscripción actualizada!",
          description: `Has cambiado al plan ${selectedPlan.name} exitosamente.`,
          variant: "default"
        })
        
        setShowModal(false)
        setSelectedPlan(null)
        
        // Refresh subscription data from Clerk
        if (refetch) {
          console.log('🔄 Refetching subscription from Clerk...')
          setTimeout(() => {
            refetch()
          }, 500)
          // Also force a page refresh to ensure UI updates
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
        
      } else {
        throw new Error(responseData?.error || `Error del servidor: ${response.status}`)
      }
      
    } catch (err) {
      console.error('Error upgrading subscription:', err)
      toast({
        title: "Error",
        description: `No se pudo actualizar la suscripción: ${err?.message || 'Error desconocido'}`,
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

  // Always show plans using static data, even if there are API issues
  if (loading && !plans.length) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Cargando planes disponibles...</p>
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
        {plans && plans.length > 0 ? (
          plans.map((plan) => {
            console.log(`🔍 Rendering plan ${plan.id}, current: ${currentPlan}, match: ${plan.id === currentPlan}`)
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlan={currentPlan}
                currentPlanData={currentPlanData}
                onUpgrade={handlePlanClick}
                isLoading={upgrading === plan.id}
              />
            )
          })
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No hay planes disponibles en este momento</p>
            <p className="text-sm text-gray-400 mt-2">Plans array: {JSON.stringify(plans)}</p>
          </div>
        )}
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