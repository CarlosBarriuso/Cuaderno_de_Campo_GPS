'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckIcon } from '@heroicons/react/24/outline'

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

interface PlanCardProps {
  plan: SubscriptionPlan
  currentPlan?: string
  currentPlanData?: SubscriptionPlan
  onUpgrade: (planId: string) => void
  isLoading?: boolean
}

export function PlanCard({ plan, currentPlan, currentPlanData, onUpgrade, isLoading }: PlanCardProps) {
  const isCurrentPlan = currentPlan === plan.id
  const isPremium = plan.price > 0
  
  console.log(`🃏 PlanCard for ${plan.id}:`, {
    planId: plan.id,
    currentPlan,
    isCurrentPlan,
    isLoading,
    onUpgrade: typeof onUpgrade
  })

  const formatPrice = (price: number, currency: string, interval: string) => {
    if (price === 0) return 'Gratis'
    return `${price.toFixed(2)} ${currency}/${interval === 'month' ? 'mes' : 'año'}`
  }

  const getPlanVariant = () => {
    if (plan.id === 'plan_free') return 'secondary'
    if (plan.id === 'plan_enterprise') return 'default'
    return 'default'
  }

  const getCardClasses = () => {
    const baseClasses = 'relative rounded-lg border p-6 shadow-sm transition-all hover:shadow-md'
    
    if (isCurrentPlan) {
      return `${baseClasses} border-green-500 bg-green-50 ring-2 ring-green-500 ring-opacity-50`
    }
    
    if (plan.id === 'plan_enterprise') {
      return `${baseClasses} border-purple-500 bg-gradient-to-b from-purple-50 to-white`
    }
    
    return `${baseClasses} border-gray-200 bg-white`
  }

  return (
    <div className={getCardClasses()}>
      {isCurrentPlan && (
        <Badge className="absolute -top-2 left-4 bg-green-500 text-white">
          Plan Actual
        </Badge>
      )}
      
      {plan.id === 'plan_enterprise' && (
        <Badge className="absolute -top-2 left-4 bg-purple-500 text-white">
          Más Popular
        </Badge>
      )}

      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
        <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="text-3xl font-bold text-gray-900">
          {formatPrice(plan.price, plan.currency, plan.interval)}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="ml-2 text-sm text-gray-700">{feature}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 text-xs text-gray-500">
        <div>
          <span className="font-medium">Parcelas:</span>{' '}
          {plan.max_parcelas === -1 ? 'Ilimitadas' : plan.max_parcelas}
        </div>
        <div>
          <span className="font-medium">Actividades:</span>{' '}
          {plan.max_actividades === -1 ? 'Ilimitadas' : plan.max_actividades}
        </div>
        <div>
          <span className="font-medium">Almacenamiento:</span> {plan.storage_gb}GB
        </div>
        <div>
          <span className="font-medium">OCR/mes:</span>{' '}
          {plan.ocr_monthly_limit === -1 ? 'Ilimitado' : plan.ocr_monthly_limit}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.preventDefault()
          console.log(`🔥 Native button clicked for plan ${plan.id}`)
          if (!isCurrentPlan && !isLoading) {
            console.log('🔥 Calling onUpgrade with:', plan.id)
            onUpgrade(plan.id)
          } else {
            console.log('🔥 Button disabled - isCurrentPlan:', isCurrentPlan, 'isLoading:', isLoading)
          }
        }}
        disabled={isCurrentPlan || isLoading}
        className={`w-full py-2 px-4 rounded font-medium transition-colors ${
          isCurrentPlan 
            ? 'bg-gray-200 text-gray-600 cursor-not-allowed' 
            : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
        }`}
      >
        {isLoading ? (
          'Procesando...'
        ) : isCurrentPlan ? (
          'Plan Actual'
        ) : (
          `Cambiar a ${plan.name}`
        )}
      </button>
    </div>
  )
}