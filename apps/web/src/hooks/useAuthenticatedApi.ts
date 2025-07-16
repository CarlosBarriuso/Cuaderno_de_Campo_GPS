'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect } from 'react'
import { api } from '@/lib/api'

/**
 * Hook para manejar autenticación automática con las APIs
 */
export function useAuthenticatedApi() {
  const { getToken, isSignedIn, isLoaded } = useAuth()

  useEffect(() => {
    const setupApiAuth = async () => {
      console.log('🔄 Setting up API authentication...', {
        isLoaded,
        isSignedIn,
        timestamp: new Date().toISOString()
      })

      if (isLoaded && isSignedIn) {
        try {
          // Obtener token de Clerk
          const token = await getToken()
          console.log('🎫 Clerk token received:', token ? 'YES' : 'NO')
          
          if (token) {
            // Para testing, usamos un token fijo
            // En producción, usar: api.setAuthToken(token)
            api.setAuthToken('test-token')
            console.log('✅ API authentication configured with test token')
            console.log('🔗 API base URL:', process.env.NEXT_PUBLIC_API_URL)
            
            // Test the authentication immediately
            try {
              const testResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/status`, {
                headers: {
                  'Authorization': 'Bearer test-token'
                }
              })
              const testData = await testResponse.json()
              console.log('🧪 Auth test response:', testData)
            } catch (testError) {
              console.error('❌ Auth test failed:', testError)
            }
          } else {
            console.warn('⚠️ No token available from Clerk')
          }
        } catch (error) {
          console.error('❌ Error setting up API authentication:', error)
        }
      } else if (isLoaded && !isSignedIn) {
        // Clear auth token when user is not signed in
        api.setAuthToken(null)
        console.log('🔓 API authentication cleared')
      } else {
        console.log('⏳ Waiting for auth to load...', { isLoaded, isSignedIn })
      }
    }

    setupApiAuth()
  }, [isSignedIn, isLoaded, getToken])

  return {
    isAuthReady: isLoaded && isSignedIn,
    isLoaded
  }
}