'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi'
import { api } from '@/lib/api'

export function PlanChangeTestSimple() {
  const { isAuthReady } = useAuthenticatedApi()
  const [plans, setPlans] = useState([])
  const [currentPlan, setCurrentPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rawResponse, setRawResponse] = useState(null)

  useEffect(() => {
    if (isAuthReady) {
      loadPlansData()
    }
  }, [isAuthReady])

  const loadPlansData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Loading plans...')
      
      const plansResponse = await api.subscription.plans()
      console.log('📄 Raw plans response:', plansResponse)
      setRawResponse(plansResponse)

      if (plansResponse && plansResponse.success && plansResponse.data) {
        console.log('✅ Plans data found:', plansResponse.data)
        setPlans(plansResponse.data)
        
        // Try to get current subscription
        try {
          const subscriptionResponse = await api.subscription.current()
          console.log('📄 Subscription response:', subscriptionResponse)
          
          if (subscriptionResponse?.success && subscriptionResponse.data) {
            const currentPlanData = plansResponse.data.find(plan => plan.id === subscriptionResponse.data.plan_id)
            setCurrentPlan(currentPlanData || null)
          }
        } catch (subErr) {
          console.warn('⚠️ Could not load current subscription:', subErr)
        }
      } else {
        throw new Error('Invalid response structure')
      }
    } catch (err) {
      console.error('❌ Error loading plans:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🧪 Simple Plan Loading Test</span>
          <Badge variant="outline">
            Auth: {isAuthReady ? '🟢 Ready' : '🔴 Not Ready'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button 
          onClick={loadPlansData} 
          disabled={!isAuthReady || loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? '⏳ Cargando...' : '🔄 Cargar Planes'}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="font-medium text-red-800">Error:</div>
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        {rawResponse && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-2">📄 Raw API Response:</h3>
            <pre className="text-xs overflow-auto max-h-64 bg-white p-3 border rounded">
              {JSON.stringify(rawResponse, null, 2)}
            </pre>
          </div>
        )}

        {currentPlan && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">📋 Current Plan:</h3>
            <div className="text-sm">
              <strong>{currentPlan.name}</strong> - {currentPlan.price} EUR/mes
            </div>
          </div>
        )}

        {plans.length > 0 && (
          <div>
            <h3 className="font-medium mb-4">🎯 Available Plans ({plans.length}):</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan, index) => (
                <div 
                  key={plan.id || index}
                  className={`border rounded-lg p-4 ${
                    plan.id === currentPlan?.id 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <h4 className="font-semibold">{plan.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                  <div className="text-lg font-medium">
                    {plan.price === 0 ? 'Gratis' : `${plan.price} EUR/mes`}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">ID: {plan.id}</div>
                  {plan.id === currentPlan?.id && (
                    <Badge className="mt-2 bg-green-100 text-green-800">Current</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">🔍 Debug Info:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Plans loaded: {plans.length}</li>
            <li>• Current plan: {currentPlan ? currentPlan.name : 'None'}</li>
            <li>• Auth ready: {isAuthReady ? 'Yes' : 'No'}</li>
            <li>• Loading: {loading ? 'Yes' : 'No'}</li>
            <li>• Error: {error ? 'Yes' : 'No'}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}