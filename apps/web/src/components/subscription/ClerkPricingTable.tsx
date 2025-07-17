'use client'

import { useUser } from '@clerk/nextjs'
import { useClerkSubscription } from '@/hooks/useClerkSubscription'

interface ClerkPricingTableProps {
  className?: string
}

export function ClerkPricingTable({ className = '' }: ClerkPricingTableProps) {
  const { isSignedIn, user } = useUser()
  const { subscription, createCheckoutSession, loading } = useClerkSubscription()

  // Plan IDs from Clerk Dashboard
  const plans = [
    {
      id: 'free',
      clerkPlanId: null, // Free plan doesn't have Clerk plan ID
      name: 'Gratuito',
      price: 0,
      description: 'Perfecto para empezar',
      features: [
        '1 parcela',
        '10 actividades/mes',
        '500 MB almacenamiento',
        '5 análisis OCR/mes',
        'Soporte por email'
      ],
      buttonText: 'Plan Actual',
      popular: false
    },
    {
      id: 'basic',
      clerkPlanId: 'cplan_300QmNaQw6zwHRX3I2LBWRWofQb',
      name: 'Básico',
      price: 9.99,
      description: 'Para pequeños productores',
      features: [
        '5 parcelas',
        '50 actividades/mes',
        '2 GB almacenamiento',
        '10 análisis OCR/mes',
        'Soporte por email',
        'Exportación PDF'
      ],
      buttonText: 'Comenzar',
      popular: false
    },
    {
      id: 'professional',
      clerkPlanId: 'cplan_300R6vZrDvKSHXZIQXf7teqUV7Q',
      name: 'Profesional',
      price: 29.99,
      description: 'Para productores medianos',
      features: [
        '25 parcelas',
        'Actividades ilimitadas',
        '10 GB almacenamiento',
        '100 análisis OCR/mes',
        'Analíticas avanzadas',
        'Soporte prioritario',
        'Exportación múltiple'
      ],
      buttonText: 'Comenzar',
      popular: true
    },
    {
      id: 'enterprise',
      clerkPlanId: 'cplan_300RG2L7Fl1HieWjKR4fVXwBtZU',
      name: 'Enterprise',
      price: 99.99,
      description: 'Para grandes explotaciones',
      features: [
        'Parcelas ilimitadas',
        'Actividades ilimitadas',
        '50 GB almacenamiento',
        'OCR ilimitado',
        'Analíticas avanzadas',
        'Soporte prioritario 24/7',
        'API completa',
        'Integraciones personalizadas'
      ],
      buttonText: 'Contactar',
      popular: false
    }
  ]

  const handleSubscribe = async (planId: string) => {
    if (!isSignedIn) {
      // Redirect to sign in
      window.location.href = '/sign-in'
      return
    }

    if (planId === 'free') {
      return // Free plan is default
    }

    try {
      const checkoutUrl = await createCheckoutSession(planId)
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
    }
  }

  // Get current user's subscription from Clerk
  const currentPlan = subscription?.planId || 'free'

  return (
    <div className={`py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Planes de Suscripción
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Elige el plan que mejor se adapte a tu explotación agrícola
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border ${
                plan.popular
                  ? 'border-green-600 bg-green-50 shadow-lg'
                  : 'border-gray-200 bg-white'
              } p-8 shadow-sm`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex rounded-full bg-green-600 px-4 py-1 text-sm font-semibold text-white">
                    Más Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {plan.description}
                </p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    €{plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-gray-500">/mes</span>
                  )}
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-3 text-sm text-gray-700">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={currentPlan === plan.id}
                  className={`w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    currentPlan === plan.id
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {currentPlan === plan.id ? 'Plan Actual' : plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Todos los planes incluyen actualizaciones gratuitas. 
            Puedes cambiar o cancelar en cualquier momento.
          </p>
        </div>
      </div>
    </div>
  )
}