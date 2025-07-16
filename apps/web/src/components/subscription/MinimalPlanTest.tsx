'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function MinimalPlanTest() {
  const [status, setStatus] = useState('Ready to test')
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)

  const testDirect = async () => {
    try {
      setStatus('Testing direct fetch...')
      setError(null)
      
      console.log('🔄 Starting direct fetch test')
      
      const response = await fetch('http://localhost:8000/api/v1/subscription/plans', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('📄 Response data:', data)
      
      setResponse(data)
      setStatus(`Success! Got ${data.data?.length || 0} plans`)
      
    } catch (err) {
      console.error('❌ Error:', err)
      setError(err.message)
      setStatus('Failed')
    }
  }

  const testWithAuth = async () => {
    try {
      setStatus('Testing with auth headers...')
      setError(null)
      
      // Get auth token from Clerk if available
      let authToken = null
      if (typeof window !== 'undefined' && (window as any).__clerk) {
        try {
          const session = await (window as any).__clerk.session
          if (session) {
            authToken = await session.getToken()
            console.log('🔑 Got Clerk token:', authToken ? 'Yes' : 'No')
          }
        } catch (authErr) {
          console.warn('⚠️ Could not get Clerk token:', authErr)
        }
      }
      
      const headers = {
        'Content-Type': 'application/json',
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }
      
      console.log('🔄 Fetching with headers:', headers)
      
      const response = await fetch('http://localhost:8000/api/v1/subscription/plans', {
        method: 'GET',
        headers
      })
      
      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('📡 Error response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      console.log('📄 Response data:', data)
      
      setResponse(data)
      setStatus(`Success with auth! Got ${data.data?.length || 0} plans`)
      
    } catch (err) {
      console.error('❌ Error:', err)
      setError(err.message)
      setStatus('Failed with auth')
    }
  }

  const testCORS = async () => {
    try {
      setStatus('Testing CORS...')
      setError(null)
      
      console.log('🔄 Testing CORS with OPTIONS')
      
      const optionsResponse = await fetch('http://localhost:8000/api/v1/subscription/plans', {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      })
      
      console.log('📡 OPTIONS response:', optionsResponse.status)
      console.log('📡 CORS headers:', Object.fromEntries(optionsResponse.headers.entries()))
      
      // Now try GET
      const getResponse = await fetch('http://localhost:8000/api/v1/subscription/plans', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        }
      })
      
      console.log('📡 GET after OPTIONS:', getResponse.status)
      
      if (!getResponse.ok) {
        throw new Error(`HTTP ${getResponse.status}`)
      }
      
      const data = await getResponse.json()
      setResponse(data)
      setStatus(`CORS test success! Got ${data.data?.length || 0} plans`)
      
    } catch (err) {
      console.error('❌ CORS Error:', err)
      setError(err.message)
      setStatus('CORS test failed')
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔍 Minimal Plan Loading Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="flex gap-3">
          <Button onClick={testDirect} className="bg-blue-600 hover:bg-blue-700">
            🧪 Test Direct
          </Button>
          <Button onClick={testWithAuth} className="bg-green-600 hover:bg-green-700">
            🔑 Test With Auth
          </Button>
          <Button onClick={testCORS} className="bg-purple-600 hover:bg-purple-700">
            🌐 Test CORS
          </Button>
        </div>

        <div className="p-4 bg-gray-50 border rounded">
          <div className="font-medium">Status:</div>
          <div className="text-sm">{status}</div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <div className="font-medium text-red-800">Error:</div>
            <div className="text-red-600 text-sm font-mono">{error}</div>
          </div>
        )}

        {response && (
          <div className="space-y-3">
            <div className="font-medium">Response:</div>
            <pre className="bg-gray-50 border rounded p-3 text-xs overflow-auto max-h-64">
              {JSON.stringify(response, null, 2)}
            </pre>
            
            {response.success && response.data && Array.isArray(response.data) && (
              <div>
                <div className="font-medium mb-2">Plans ({response.data.length}):</div>
                <div className="grid grid-cols-2 gap-2">
                  {response.data.map((plan, index) => (
                    <div key={index} className="border rounded p-2 bg-white">
                      <div className="font-semibold">{plan.name}</div>
                      <div className="text-sm text-gray-600">{plan.price} EUR/mes</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <div className="font-medium text-yellow-900 mb-2">Debug Info:</div>
          <div className="text-sm text-yellow-800 space-y-1">
            <div>• Current URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</div>
            <div>• Origin: {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</div>
            <div>• Clerk available: {typeof window !== 'undefined' && (window as any).__clerk ? 'Yes' : 'No'}</div>
          </div>
        </div>
        
      </CardContent>
    </Card>
  )
}