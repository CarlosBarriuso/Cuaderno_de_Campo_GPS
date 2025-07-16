'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlanChangeModal } from './PlanChangeModal'
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi'
import { api } from '@/lib/api'

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

export function PlanChangeWorkingComponent() {
  const { isAuthReady } = useAuthenticatedApi()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any[]>([])

  const loadPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Loading plans...')

      // Load plans
      const plansResponse = await api.subscription.plans()
      console.log('📄 Plans response:', plansResponse)

      if (plansResponse?.success && plansResponse.data && Array.isArray(plansResponse.data)) {
        const sortedPlans = plansResponse.data.sort((a, b) => {
          const order = { 'plan_free': 0, 'plan_basic': 1, 'plan_pro': 2, 'plan_enterprise': 3 }
          return (order[a.id] || 999) - (order[b.id] || 999)
        })
        
        console.log('✅ Setting plans:', sortedPlans)
        setPlans(sortedPlans)

        // Load current subscription
        try {
          const subscriptionResponse = await api.subscription.current()
          console.log('📄 Subscription response:', subscriptionResponse)
          
          if (subscriptionResponse?.success && subscriptionResponse.data) {
            const current = sortedPlans.find(plan => plan.id === subscriptionResponse.data.plan_id)
            console.log('✅ Setting current plan:', current)
            setCurrentPlan(current || null)
          }
        } catch (subError) {
          console.warn('⚠️ Could not load subscription:', subError)
        }
      } else {
        throw new Error('Invalid plans response')
      }
    } catch (err) {
      console.error('❌ Error loading plans:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-load on auth ready
  useEffect(() => {
    if (isAuthReady) {
      loadPlans()
    }
  }, [isAuthReady])

  const handlePlanClick = (plan: SubscriptionPlan) => {
    if (plan.id === currentPlan?.id) return
    setSelectedPlan(plan)
    setShowModal(true)
  }

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return

    try {
      setUpgrading(true)
      console.log(`🔄 Upgrading to ${selectedPlan.name}...`)
      
      const response = await api.subscription.upgrade(selectedPlan.id)
      console.log('📄 Upgrade response:', response)
      
      if (response?.success) {
        const result = {
          test: `Plan change: ${currentPlan?.name} → ${selectedPlan.name}`,
          status: 'success' as const,
          data: response,
          timestamp: new Date().toISOString()
        }
        
        setTestResults(prev => [...prev, result])
        setCurrentPlan(selectedPlan)
        setShowModal(false)
        setSelectedPlan(null)
        
        console.log('✅ Plan change successful')
      } else {
        throw new Error(response?.error || 'Upgrade failed')
      }
    } catch (err) {
      const result = {
        test: `Plan change: ${currentPlan?.name} → ${selectedPlan.name}`,
        status: 'error' as const,
        error: err.message,
        timestamp: new Date().toISOString()
      }
      
      setTestResults(prev => [...prev, result])
      console.error('❌ Plan change failed:', err)
    } finally {
      setUpgrading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🧪 Plan Change Testing (Working Version)</span>
          <Badge variant="outline">
            Auth: {isAuthReady ? '🟢 Ready' : '🔴 Not Ready'} | Plans: {plans.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Controls */}
        <div className="flex gap-3">
          <Button 
            onClick={loadPlans} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? '⏳ Cargando...' : '🔄 Cargar Planes'}
          </Button>
          
          {testResults.length > 0 && (
            <Button 
              onClick={clearResults} 
              variant="outline"
            >
              🗑️ Limpiar Resultados ({testResults.length})
            </Button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="font-medium text-red-800">Error:</div>
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando planes...</p>
          </div>
        )}

        {/* Current Plan */}
        {currentPlan && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">📋 Plan Actual</h3>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">{currentPlan.name}</span>
                <span className="text-sm text-gray-600 ml-2">
                  {currentPlan.price === 0 ? 'Gratis' : `${currentPlan.price} EUR/mes`}
                </span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">{currentPlan.id}</Badge>
            </div>
          </div>
        )}

        {/* Available Plans */}
        {plans.length > 0 ? (
          <div>
            <h3 className="font-medium mb-4">🎯 Planes Disponibles ({plans.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    plan.id === currentPlan?.id 
                      ? 'bg-green-50 border-green-200 ring-2 ring-green-500 ring-opacity-50' 
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                  onClick={() => handlePlanClick(plan)}
                >
                  <h4 className="font-semibold">{plan.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                  <div className="text-lg font-medium">
                    {plan.price === 0 ? 'Gratis' : `${plan.price} EUR/mes`}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Parcelas: {plan.max_parcelas === -1 ? '∞' : plan.max_parcelas}
                  </div>
                  {plan.id === currentPlan?.id && (
                    <Badge className="mt-2 bg-green-100 text-green-800">Plan Actual</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          !loading && (
            <div className="text-center py-8 text-gray-500">
              {error ? 'Error cargando planes' : 'No se encontraron planes. Haz click en "Cargar Planes".'}
            </div>
          )
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">📊 Resultados de Tests ({testResults.length})</h3>
            
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${
                  result.status === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{result.test}</span>
                  <Badge className={result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {result.status === 'success' ? '✅ Success' : '❌ Error'}
                  </Badge>
                </div>
                
                {result.status === 'success' && result.data && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer">Ver respuesta JSON</summary>
                    <pre className="mt-2 p-3 bg-white border rounded text-xs overflow-auto max-h-48">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
                
                {result.status === 'error' && (
                  <div className="mt-2 text-sm text-red-600 font-mono bg-red-100 p-2 rounded">
                    {result.error}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  ⏰ {new Date(result.timestamp).toLocaleString('es-ES')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Plan Change Modal */}
        <PlanChangeModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setSelectedPlan(null)
          }}
          onConfirm={handleConfirmUpgrade}
          currentPlan={currentPlan}
          newPlan={selectedPlan}
          isLoading={upgrading}
        />

        {/* Info */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">ℹ️ Información</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Esta es una versión limpia y funcional del componente</li>
            <li>• Click en cualquier plan (excepto el actual) para probar el modal</li>
            <li>• Los cambios se procesan usando el endpoint real del backend</li>
            <li>• Se muestran los resultados detallados de cada operación</li>
          </ul>
        </div>
        
      </CardContent>
    </Card>
  )
}