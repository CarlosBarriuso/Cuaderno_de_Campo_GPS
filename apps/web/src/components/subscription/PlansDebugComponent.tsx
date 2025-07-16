'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi'
import { api } from '@/lib/api'

export function PlansDebugComponent() {
  const { isAuthReady } = useAuthenticatedApi()
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([])

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { message, type, timestamp }])
    console.log(`[${timestamp}] ${message}`)
  }

  const clearLogs = () => {
    setLogs([])
    setResponse(null)
    setError(null)
  }

  const testDirectAPI = async () => {
    try {
      setLoading(true)
      setError(null)
      addLog('🔄 Starting direct API test...', 'info')
      
      addLog(`📊 Auth ready: ${isAuthReady}`, 'info')
      
      // Test direct fetch to API
      addLog('🌐 Testing direct fetch to localhost:8000...', 'info')
      const directResponse = await fetch('http://localhost:8000/api/v1/subscription/plans')
      addLog(`📡 Direct fetch status: ${directResponse.status}`, directResponse.ok ? 'success' : 'error')
      
      if (directResponse.ok) {
        const directData = await directResponse.json()
        addLog(`📄 Direct fetch data: ${JSON.stringify(directData, null, 2)}`, 'success')
      }
      
      // Test through API client
      addLog('🔧 Testing through api client...', 'info')
      const apiResponse = await api.subscription.plans()
      addLog(`📊 API client response: ${JSON.stringify(apiResponse, null, 2)}`, apiResponse ? 'success' : 'error')
      
      setResponse(apiResponse)
      addLog('✅ API test completed successfully', 'success')
      
    } catch (err) {
      addLog(`❌ Error: ${err.message}`, 'error')
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testAuthToken = async () => {
    try {
      addLog('🔐 Testing authentication...', 'info')
      
      const authResponse = await api.auth.status()
      addLog(`🔑 Auth status: ${JSON.stringify(authResponse, null, 2)}`, 'info')
      
      const userResponse = await api.auth.me()
      addLog(`👤 User info: ${JSON.stringify(userResponse, null, 2)}`, 'info')
      
    } catch (err) {
      addLog(`❌ Auth error: ${err.message}`, 'error')
    }
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🔍 Advanced Plans API Debug</span>
          <Badge variant="outline">
            Auth: {isAuthReady ? '🟢 Ready' : '🔴 Not Ready'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Test Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={testDirectAPI} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? '⏳ Testing...' : '🧪 Test Plans API'}
          </Button>
          
          <Button 
            onClick={testAuthToken} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            🔐 Test Authentication
          </Button>
          
          <Button 
            onClick={clearLogs} 
            variant="outline"
          >
            🗑️ Clear Logs
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="font-medium text-red-800">Error:</div>
            <div className="text-red-600 text-sm font-mono">{error}</div>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">📋 Debug Logs:</h3>
            <div className="max-h-64 overflow-y-auto bg-gray-50 border rounded p-3">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`text-sm font-mono ${
                    log.type === 'error' ? 'text-red-600' :
                    log.type === 'success' ? 'text-green-600' :
                    'text-gray-700'
                  }`}
                >
                  [{log.timestamp}] {log.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Response Data */}
        {response && (
          <div className="space-y-2">
            <h3 className="font-medium">📊 API Response:</h3>
            <pre className="bg-gray-50 border rounded p-3 text-xs overflow-auto max-h-64">
              {JSON.stringify(response, null, 2)}
            </pre>
            
            {response.success && response.data && Array.isArray(response.data) && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">📋 Parsed Plans ({response.data.length}):</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {response.data.map((plan, index) => (
                    <div key={plan.id || index} className="border rounded p-3 bg-white">
                      <h5 className="font-semibold">{plan.name}</h5>
                      <p className="text-sm text-gray-600">{plan.price} EUR/mes</p>
                      <p className="text-xs text-gray-500">ID: {plan.id}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* System Info */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">🔧 System Info:</h4>
          <div className="text-sm text-yellow-800 space-y-1">
            <div>• Auth Ready: {isAuthReady ? 'Yes' : 'No'}</div>
            <div>• Current URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</div>
            <div>• API Base URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</div>
            <div>• Loading: {loading ? 'Yes' : 'No'}</div>
          </div>
        </div>
        
      </CardContent>
    </Card>
  )
}