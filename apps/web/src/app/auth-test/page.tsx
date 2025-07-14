'use client'

import { AuthTestComponent } from '@/components/auth/AuthTestComponent'

export default function AuthTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🧪 Testing de Autenticación</h1>
          <p className="text-lg text-gray-600 mt-2">
            Pruebas de integración entre Clerk y el backend API
          </p>
        </div>
        
        <AuthTestComponent />
      </div>
    </div>
  )
}