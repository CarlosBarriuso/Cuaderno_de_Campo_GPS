'use client'

import { useSubscription } from '@/hooks/useSubscription'
import { useUser } from '@clerk/nextjs'

export function SubscriptionDebug() {
  const { user, isSignedIn } = useUser()
  const { subscription, loading, error } = useSubscription()

  if (!isSignedIn) return null

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <div className="font-bold mb-2">Debug Info:</div>
      <div>User: {user?.firstName || 'No name'}</div>
      <div>Signed In: {isSignedIn ? 'Yes' : 'No'}</div>
      <div>Subscription Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Subscription Error: {error || 'None'}</div>
      <div>Subscription Plan: {subscription?.plan || 'None'}</div>
      <div>Subscription Status: {subscription?.status || 'None'}</div>
    </div>
  )
}