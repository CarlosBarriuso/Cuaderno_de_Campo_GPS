'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi'
import { api } from '@/lib/api'

export function UserInfoTestComponent() {
  const { isAuthReady } = useAuthenticatedApi()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadUserInfo = async () => {
    if (!isAuthReady) {
      setError('Authentication not ready')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Loading user info with subscription...')
      
      const response = await api.auth.me()
      console.log('✅ User info response:', response)
      
      setUserInfo(response)
    } catch (err) {
      console.error('❌ Error loading user info:', err)
      setError(err.message || 'Error loading user information')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🧪 Testing Información de Usuario</span>
          <Badge variant="outline">
            Auth: {isAuthReady ? '🟢 Ready' : '🔴 Not Ready'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button 
            onClick={loadUserInfo} 
            disabled={!isAuthReady || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? '⏳ Cargando...' : '👤 Cargar Información de Usuario'}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 font-medium">Error:</div>
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        {userInfo && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">📊 Información del Usuario</h3>
            
            {userInfo.success && userInfo.data && (
              <div className="space-y-4">
                {/* User Basic Info */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">👤 Datos Básicos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Nombre:</span> {userInfo.data.firstName} {userInfo.data.lastName}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {userInfo.data.email}
                    </div>
                    <div>
                      <span className="font-medium">ID:</span> {userInfo.data.id}
                    </div>
                    <div>
                      <span className="font-medium">Clerk ID:</span> {userInfo.data.clerk_id}
                    </div>
                  </div>
                </div>

                {/* Subscription Info */}
                {userInfo.data.subscription && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">💳 Información de Suscripción</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Plan:</span> 
                        <Badge className="ml-2 bg-green-100 text-green-800">
                          {userInfo.data.subscription.plan}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Estado:</span> 
                        <Badge className="ml-2 bg-blue-100 text-blue-800">
                          {userInfo.data.subscription.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Precio:</span> 
                        {userInfo.data.subscription.precio} {userInfo.data.subscription.moneda}/mes
                      </div>
                      <div>
                        <span className="font-medium">Hectáreas:</span> 
                        {userInfo.data.subscription.hectareasUsadas} / {userInfo.data.subscription.hectareasLimite}
                      </div>
                      <div>
                        <span className="font-medium">Inicio:</span> 
                        {formatDate(userInfo.data.subscription.fechaInicio)}
                      </div>
                      <div>
                        <span className="font-medium">Renovación:</span> 
                        {formatDate(userInfo.data.subscription.fechaVencimiento)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw Response */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <details className="cursor-pointer">
                    <summary className="font-medium text-gray-700 hover:text-gray-900">
                      📄 Ver respuesta completa JSON
                    </summary>
                    <pre className="mt-2 p-3 bg-white border rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(userInfo, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">ℹ️ Información del Test</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Test del endpoint <code>/api/v1/auth/me</code></li>
            <li>• Verificación de token de autenticación Clerk</li>
            <li>• Validación de datos de usuario + suscripción</li>
            <li>• Comprobación de estructura de respuesta</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}