'use client'

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useClerkSubscription } from '@/hooks/useClerkSubscription'
import { UserDropdown } from '@/components/user/UserDropdown'

export function AuthNavigation() {
  const { isSignedIn, user, isLoaded } = useUser()
  const { subscription, loading } = useClerkSubscription()

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <nav className="bg-green-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">🌾 Cuaderno de Campo GPS</h1>
          <div className="space-x-4">
            <span className="animate-pulse">Cargando...</span>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-green-600 text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold hover:text-green-200">
          🌾 Cuaderno de Campo GPS
        </Link>
        
        <div className="flex items-center space-x-4">
          {/* Navigation Links - Only show if user is signed in */}
          {isSignedIn && (
            <div className="hidden md:flex space-x-4">
              <Link href="/" className="hover:text-green-200">Dashboard</Link>
              <Link href="/parcelas" className="hover:text-green-200">Parcelas</Link>
              <Link href="/actividades" className="hover:text-green-200">Actividades</Link>
              <Link href="/mapa" className="hover:text-green-200">Mapa</Link>
              <Link href="/sigpac" className="hover:text-green-200">SIGPAC</Link>
              <Link href="/subscription" className="hover:text-green-200">Suscripción</Link>
            </div>
          )}
          
          {/* Authentication Section */}
          <div className="flex items-center space-x-3">
            {isSignedIn ? (
              <div className="flex items-center space-x-4">
                {/* Subscription Info - Improved with better visual hierarchy */}
                {subscription && (
                  <Link 
                    href="/subscription" 
                    className="hidden lg:flex flex-col items-end text-xs hover:opacity-80 hover:scale-105 transition-all duration-200 cursor-pointer group"
                    title="Click para gestionar tu suscripción"
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${subscription.planId === 'free' ? 'bg-white/20 text-white' : 'bg-white/30 text-white'} border group-hover:border-white/40`}>
                        {subscription.planId === 'free' ? '🆓' : subscription.planId === 'basic' ? '⭐' : subscription.planId === 'professional' ? '💼' : '🏢'} {subscription.planName}
                      </span>
                      <span className="text-white/70 group-hover:text-white text-xs">→</span>
                    </div>
                    <span className="text-xs mt-1 text-green-100">
                      0/{subscription.planId === 'free' ? '1' : subscription.planId === 'basic' ? '5' : subscription.planId === 'professional' ? '25' : 'Ilimitado'} parcelas (0%)
                    </span>
                  </Link>
                )}
                
                {/* User Dropdown - Custom implementation */}
                <UserDropdown />
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <SignInButton mode="modal">
                  <button className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Iniciar Sesión
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-white text-green-600 hover:bg-green-50 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Registrarse
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation - Only show if user is signed in */}
      {isSignedIn && (
        <div className="md:hidden mt-4 pt-4 border-t border-green-500">
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="text-sm hover:text-green-200">Dashboard</Link>
            <Link href="/parcelas" className="text-sm hover:text-green-200">Parcelas</Link>
            <Link href="/actividades" className="text-sm hover:text-green-200">Actividades</Link>
            <Link href="/mapa" className="text-sm hover:text-green-200">Mapa</Link>
            <Link href="/sigpac" className="text-sm hover:text-green-200">SIGPAC</Link>
            <Link href="/subscription" className="text-sm hover:text-green-200">Suscripción</Link>
          </div>
        </div>
      )}
    </nav>
  )
}