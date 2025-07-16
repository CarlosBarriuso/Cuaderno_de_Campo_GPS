'use client'

import { useSubscription } from '@/hooks/useSubscription'
import Link from 'next/link'
import { ChevronRightIcon, SparklesIcon } from '@heroicons/react/24/outline'

interface DashboardPlanCardProps {
  showUpgrade?: boolean
  className?: string
}

export function DashboardPlanCard({ showUpgrade = true, className = '' }: DashboardPlanCardProps) {
  const { subscription, getPlanDisplayName, getPlanColor, getUsagePercentage, isNearLimit } = useSubscription()

  if (!subscription) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const planFeatures = {
    plan_free: {
      name: 'Gratuito',
      price: 'Gratis',
      features: ['1 parcela', '10 actividades/mes', '0.5 GB almacenamiento'],
      nextPlan: 'plan_basic',
      nextPlanName: 'Básico',
      nextPlanPrice: '€9.99/mes'
    },
    plan_basic: {
      name: 'Básico',
      price: '€9.99/mes',
      features: ['5 parcelas', '50 actividades/mes', '2 GB almacenamiento'],
      nextPlan: 'plan_professional',
      nextPlanName: 'Profesional',
      nextPlanPrice: '€29.99/mes'
    },
    plan_professional: {
      name: 'Profesional',
      price: '€29.99/mes',
      features: ['25 parcelas', '200 actividades/mes', '10 GB almacenamiento'],
      nextPlan: 'plan_enterprise',
      nextPlanName: 'Enterprise',
      nextPlanPrice: '€99.99/mes'
    },
    plan_enterprise: {
      name: 'Enterprise',
      price: '€99.99/mes',
      features: ['Parcelas ilimitadas', 'Actividades ilimitadas', '50 GB almacenamiento'],
      nextPlan: null,
      nextPlanName: null,
      nextPlanPrice: null
    }
  }

  const currentPlan = planFeatures[subscription.plan] || planFeatures.plan_free
  const usagePercentage = getUsagePercentage()

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Plan Actual</h3>
          <p className="text-sm text-gray-600">Tu suscripción activa</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(subscription.plan)}`}>
          {getPlanDisplayName(subscription.plan)}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold text-gray-900">{currentPlan.price}</span>
          {subscription.plan !== 'plan_free' && (
            <span className="text-sm text-gray-500">por mes</span>
          )}
        </div>
        <ul className="text-sm text-gray-600 space-y-1">
          {currentPlan.features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Usage Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Uso actual</span>
          <span className={`text-sm font-medium ${isNearLimit() ? 'text-amber-600' : 'text-gray-600'}`}>
            {usagePercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              usagePercentage >= 90 ? 'bg-red-500' : 
              usagePercentage >= 70 ? 'bg-amber-500' : 
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {subscription.hectareasUsadas || 0} de {subscription.hectareasLimite || subscription.max_parcelas || 1} parcelas utilizadas
        </p>
      </div>

      {/* Upgrade CTA */}
      {showUpgrade && currentPlan.nextPlan && (
        <div className="border-t border-gray-100 pt-4">
          <Link
            href="/subscription?tab=plans"
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors group"
          >
            <SparklesIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            Actualizar a {currentPlan.nextPlanName}
            <ChevronRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Por solo {currentPlan.nextPlanPrice}
          </p>
        </div>
      )}

      {/* Manage Plan Link */}
      <div className={`${showUpgrade && currentPlan.nextPlan ? 'mt-3' : ''}`}>
        <Link
          href="/subscription"
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors group"
        >
          Gestionar Plan
          <ChevronRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}