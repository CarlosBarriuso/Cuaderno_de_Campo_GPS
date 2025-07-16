'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi'
import { api } from '@/lib/api'

export function SubscriptionTestComponent() {
  const { isAuthReady } = useAuthenticatedApi()
  const [testResults, setTestResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    try {
      console.log(`🧪 Running test: ${testName}`)
      const result = await testFunction()
      
      const testResult = {
        test: testName,
        status: 'success' as const,
        data: result,
        timestamp: new Date().toISOString()
      }
      
      console.log(`✅ ${testName} passed:`, result)
      setTestResults(prev => [...prev, testResult])
      return result
    } catch (error) {
      const testResult = {
        test: testName,
        status: 'error' as const,
        error: error.message,
        timestamp: new Date().toISOString()
      }
      
      console.error(`❌ ${testName} failed:`, error)
      setTestResults(prev => [...prev, testResult])
      throw error
    }
  }

  const runAllTests = async () => {
    if (!isAuthReady) {
      alert('Authentication not ready. Please wait...')
      return
    }

    setIsLoading(true)
    setTestResults([])

    try {
      // Test 1: Health Check
      await runTest('Backend Health Check', async () => {
        return await api.health()
      })

      // Test 2: Get Available Plans
      await runTest('Get Subscription Plans', async () => {
        return await api.subscription.plans()
      })

      // Test 3: Get Current Subscription
      await runTest('Get Current Subscription', async () => {
        return await api.subscription.current()
      })

      // Test 4: Get Subscription Usage
      await runTest('Get Subscription Usage', async () => {
        return await api.subscription.usage()
      })

      // Test 5: Test Plan Upgrade (Mock)
      await runTest('Test Plan Upgrade', async () => {
        return await api.subscription.upgrade('plan_pro')
      })

      // Test 6: Test Subscription Cancel (Mock)
      await runTest('Test Subscription Cancel', async () => {
        return await api.subscription.cancel()
      })

      console.log('🎉 All subscription tests completed successfully!')
      
    } catch (error) {
      console.error('❌ Some tests failed:', error)
    } finally {
      setIsLoading(false)
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🧪 Testing de Suscripciones - Cuaderno de Campo GPS</span>
          <Badge variant="outline">
            Auth: {isAuthReady ? '🟢 Ready' : '🔴 Not Ready'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button 
            onClick={runAllTests} 
            disabled={!isAuthReady || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? '⏳ Ejecutando Tests...' : '🚀 Ejecutar Tests de Suscripción'}
          </Button>
          
          <Button 
            onClick={clearResults} 
            variant="outline"
            disabled={testResults.length === 0}
          >
            🗑️ Limpiar Resultados
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">📊 Resultados de Tests</h3>
            
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

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">ℹ️ Información del Test</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Tests de conectividad con backend FastAPI en puerto 8000</li>
            <li>• Verificación de autenticación Clerk</li>
            <li>• Pruebas de endpoints de suscripción (/api/v1/subscription/*)</li>
            <li>• Validación de estructura de respuesta de la API</li>
            <li>• Mock data para planes, uso y gestión de suscripciones</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}