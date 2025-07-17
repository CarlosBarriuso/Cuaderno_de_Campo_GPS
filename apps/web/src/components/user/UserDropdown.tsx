'use client'

import { useState, useRef, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useClerkSubscription } from '@/hooks/useClerkSubscription'
import Link from 'next/link'
import { ChevronDownIcon, CreditCardIcon, UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

export function UserDropdown() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { subscription, loading } = useClerkSubscription()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' })
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/20 rounded-md p-1"
      >
        <span className="text-green-100">
          {user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0]}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-green-200 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {user.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Plan Information */}
          {loading ? (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ) : subscription ? (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Plan actual
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subscription.planId === 'free' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                    {subscription.planName}
                  </span>
                </div>
                <Link
                  href="/subscription"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  Cambiar →
                </Link>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Plan actual
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Gratuito
                  </span>
                </div>
                <Link
                  href="/subscription"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  Cambiar →
                </Link>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/subscription"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <CreditCardIcon className="w-4 h-4 mr-3 text-gray-400" />
              Gestionar Suscripción
            </Link>
            
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <UserIcon className="w-4 h-4 mr-3 text-gray-400" />
              Mi Perfil
            </Link>
            
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Cog6ToothIcon className="w-4 h-4 mr-3 text-gray-400" />
              Configuración
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3 text-gray-400" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}