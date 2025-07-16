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

export function PlanChangeTestComponent() {
  const { isAuthReady } = useAuthenticatedApi()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any[]>([])

  useEffect(() => {
    console.log('🔄 Auth ready status changed:', isAuthReady)
    if (isAuthReady) {
      loadPlansData()
    }
  }, [isAuthReady])

  // Force load on component mount for debugging
  useEffect(() => {
    console.log('🔄 Component mounted, attempting to load plans...')
    // Small delay to ensure auth is ready
    const timer = setTimeout(() => {
      if (isAuthReady && plans.length === 0) {
        console.log('🔄 Force loading plans...')
        loadPlansData()
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  const loadPlansData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Loading plans and subscription...')

      const [plansResponse, subscriptionResponse] = await Promise.all([
        api.subscription.plans(),
        api.subscription.current()
      ])

      console.log('📄 Plans response:', plansResponse)
      console.log('📄 Subscription response:', subscriptionResponse)

      if (plansResponse?.success && plansResponse.data && Array.isArray(plansResponse.data)) {
        const orderedPlans = plansResponse.data.sort((a, b) => {
          const order = { 'plan_free': 0, 'plan_basic': 1, 'plan_pro': 2, 'plan_enterprise': 3 }
          return (order[a.id] || 999) - (order[b.id] || 999)
        })
        
        console.log('✅ Ordered plans:', orderedPlans)
        setPlans(orderedPlans)

        if (subscriptionResponse?.success && subscriptionResponse.data) {
          const currentPlanData = orderedPlans.find(plan => plan.id === subscriptionResponse.data.plan_id)
          console.log('✅ Current plan found:', currentPlanData)
          setCurrentPlan(currentPlanData || null)
        }
      } else {
        console.error('❌ Invalid plans response structure:', plansResponse)
        setError('Invalid response structure from plans API')
      }
    } catch (err) {
      console.error('❌ Error loading plans:', err)
      setError(`Error al cargar planes: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testPlanChange = (newPlan: SubscriptionPlan) => {
    setSelectedPlan(newPlan)
    setShowModal(true)
  }

  const confirmPlanChange = async () => {
    if (!selectedPlan) return

    try {
      setUpgrading(true)
      
      const response = await api.subscription.upgrade(selectedPlan.id)
      
      if (response?.success) {
        const result = {
          test: `Cambio de plan: ${currentPlan?.name} → ${selectedPlan.name}`,
          status: 'success' as const,
          data: response,
          timestamp: new Date().toISOString()
        }
        
        setTestResults(prev => [...prev, result])
        setCurrentPlan(selectedPlan)
        setShowModal(false)
        
        console.log('✅ Plan change successful:', response)
      } else {
        throw new Error(response?.error || 'Error en cambio de plan')
      }
    } catch (err) {
      const result = {
        test: `Cambio de plan: ${currentPlan?.name} → ${selectedPlan.name}`,
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

  const getStatusBadge = (status: 'success' | 'error') => {
    if (status === 'success') {
      return <Badge className="bg-green-100 text-green-800">✅ Success</Badge>
    }
    return <Badge className="bg-red-100 text-red-800">❌ Error</Badge>
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🧪 Testing Cambio de Planes</span>
          <Badge variant="outline">
            Auth: {isAuthReady ? '🟢 Ready' : '🔴 Not Ready'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Manual Load Button */}
        <div className="flex gap-3">
          <Button 
            onClick={loadPlansData} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? '⏳ Cargando...' : '🔄 Cargar Planes'}
          </Button>
          
          <Button 
            onClick={clearResults} 
            variant="outline"
            disabled={testResults.length === 0}
          >
            🗑️ Limpiar Resultados
          </Button>
        </div>

        {loading && (
          <div className="text-center py-4">Cargando planes...</div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <div className="font-medium">Error:</div>
            <div>{error}</div>
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

        {/* Available Plans for Testing */}
        {plans.length > 0 && (
          <div>
            <h3 className="font-medium mb-4">🎯 Planes Disponibles para Cambio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`border rounded-lg p-4 ${
                    plan.id === currentPlan?.id 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200 hover:border-blue-300 cursor-pointer'
                  }`}
                  onClick={() => plan.id !== currentPlan?.id && testPlanChange(plan)}
                >
                  <h4 className="font-semibold">{plan.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                  <div className="text-lg font-medium">
                    {plan.price === 0 ? 'Gratis' : `${plan.price} EUR/mes`}
                  </div>
                  {plan.id === currentPlan?.id && (
                    <Badge className="mt-2 bg-green-100 text-green-800">Plan Actual</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">📊 Resultados de Tests</h3>
              <Button onClick={clearResults} variant="outline" size="sm">
                🗑️ Limpiar
              </Button>
            </div>
            
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
                  {getStatusBadge(result.status)}
                </div>
                
                {result.status === 'success' && result.data && (
                  <div className="mt-2">
                    <details className="cursor-pointer">
                      <summary className="text-sm text-gray-600 hover:text-gray-800">
                        📄 Ver respuesta JSON
                      </summary>
                      <pre className="mt-2 p-3 bg-white border rounded text-xs overflow-auto max-h-48">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
                
                {result.status === 'error' && (
                  <div className="mt-2">
                    <div className="text-sm text-red-600 font-mono bg-red-100 p-2 rounded">
                      {result.error}
                    </div>
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
          onClose={() => setShowModal(false)}
          onConfirm={confirmPlanChange}
          currentPlan={currentPlan}
          newPlan={selectedPlan}
          isLoading={upgrading}
        />

        {/* Info */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">ℹ️ Información del Test</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Click en cualquier plan (excepto el actual) para simular cambio</li>
            <li>• Se abrirá modal de confirmación con comparación detallada</li>
            <li>• El cambio se procesa usando endpoint <code>/api/v1/subscription/upgrade</code></li>
            <li>• Resultados reales del backend FastAPI con mock data</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}