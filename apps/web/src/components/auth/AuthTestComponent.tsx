'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi'
import { api } from '@/lib/api'
import { useState } from 'react'

export function AuthTestComponent() {
  const { isSignedIn, user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const { isAuthReady } = useAuthenticatedApi()
  const [testResults, setTestResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addTestResult = (name: string, success: boolean, data?: any, error?: any) => {
    const result = {
      name,
      success,
      data,
      error: error?.message || error,
      timestamp: new Date().toLocaleTimeString()
    }
    
    setTestResults(prev => [result, ...prev])
    
    // Log to console for debugging
    if (success) {
      console.log(`✅ ${name}:`, data)
    } else {
      console.error(`❌ ${name}:`, error)
    }
  }

  const runApiTests = async () => {
    setIsLoading(true)
    setTestResults([])

    try {
      // Test 1: Health check (public endpoint)
      try {
        const healthData = await api.health()
        addTestResult('Health Check (Public)', true, healthData)
      } catch (error) {
        addTestResult('Health Check (Public)', false, null, error)
      }

      // Test 2: Auth status without token
      try {
        // Temporarily clear token to test unauthenticated state
        api.setAuthToken(null)
        const statusData = await api.auth.status?.() || await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/status`).then(r => r.json())
        addTestResult('Auth Status (No Token)', true, statusData)
      } catch (error) {
        addTestResult('Auth Status (No Token)', false, null, error)
      }

      if (isSignedIn) {
        // Test 3: Get Clerk token
        try {
          const token = await getToken()
          addTestResult('Get Clerk Token', true, { hasToken: !!token, tokenLength: token?.length })
          
          // Set auth token for subsequent tests
          api.setAuthToken('test-token') // Using test token for demo
        } catch (error) {
          addTestResult('Get Clerk Token', false, null, error)
        }

        // Test 4: Auth status with token
        try {
          const statusData = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/status`, {
            headers: { 'Authorization': 'Bearer test-token' }
          }).then(r => r.json())
          addTestResult('Auth Status (With Token)', true, statusData)
        } catch (error) {
          addTestResult('Auth Status (With Token)', false, null, error)
        }

        // Test 5: Get user info
        try {
          const userData = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
            headers: { 'Authorization': 'Bearer test-token' }
          }).then(r => r.json())
          addTestResult('Get User Info', true, userData)
        } catch (error) {
          addTestResult('Get User Info', false, null, error)
        }

        // Test 6: Protected endpoint - Parcelas
        try {
          const parcelasData = await api.parcelas.getAll()
          addTestResult('Get Parcelas (Protected)', true, parcelasData)
        } catch (error) {
          addTestResult('Get Parcelas (Protected)', false, null, error)
        }

        // Test 7: Protected endpoint - Actividades
        try {
          const actividadesData = await api.actividades.getAll()
          addTestResult('Get Actividades (Protected)', true, actividadesData)
        } catch (error) {
          addTestResult('Get Actividades (Protected)', false, null, error)
        }
      }

    } catch (error) {
      addTestResult('API Tests', false, null, error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
    console.clear()
  }

  if (!isLoaded) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <p className="text-yellow-800">🔄 Cargando información de autenticación...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🔐 Test de Autenticación</h2>
        
        {/* Auth Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold text-gray-700">Clerk Estado</h3>
            <p className={isSignedIn ? 'text-green-600' : 'text-red-600'}>
              {isSignedIn ? '✅ Autenticado' : '❌ No autenticado'}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold text-gray-700">API Ready</h3>
            <p className={isAuthReady ? 'text-green-600' : 'text-orange-600'}>
              {isAuthReady ? '✅ API Lista' : '⏳ Configurando'}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold text-gray-700">Usuario</h3>
            <p className="text-sm text-gray-600">
              {user ? `${user.firstName || user.emailAddresses[0]?.emailAddress}` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={runApiTests}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md"
          >
            {isLoading ? '🔄 Probando...' : '🧪 Ejecutar Tests API'}
          </button>
          
          <button
            onClick={clearResults}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            🗑️ Limpiar Resultados
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Resultados de Tests:</h3>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border-l-4 ${
                    result.success 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-red-500 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.success ? '✅' : '❌'} {result.name}
                    </span>
                    <span className="text-xs text-gray-500">{result.timestamp}</span>
                  </div>
                  
                  {result.data && (
                    <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                  
                  {result.error && (
                    <p className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded">
                      Error: {result.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Console Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded">
          <h4 className="font-semibold text-blue-900">📊 Para ver errores detallados:</h4>
          <ol className="text-sm text-blue-800 mt-2 space-y-1">
            <li>1. Abre DevTools del navegador (F12)</li>
            <li>2. Ve a la pestaña "Console"</li>
            <li>3. Ejecuta los tests y observa los logs</li>
            <li>4. Busca mensajes que empiecen con ✅ (éxito) o ❌ (error)</li>
          </ol>
        </div>
      </div>
    </div>
  )
}