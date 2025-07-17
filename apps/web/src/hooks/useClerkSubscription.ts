'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

interface SubscriptionData {
  planId: string
  planName: string
  status: 'active' | 'canceled' | 'past_due' | 'incomplete'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
}

export function useClerkSubscription() {
  const { user, isLoaded } = useUser()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    const fetchSubscription = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!user) {
          setSubscription(null)
          return
        }

        // Get subscription data from user metadata
        const subscriptionData = user.publicMetadata?.subscription as any
        
        if (subscriptionData) {
          setSubscription({
            planId: subscriptionData.planId || 'free',
            planName: subscriptionData.planName || 'Free',
            status: subscriptionData.status || 'active',
            currentPeriodStart: new Date(subscriptionData.currentPeriodStart || Date.now()),
            currentPeriodEnd: new Date(subscriptionData.currentPeriodEnd || Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd || false
          })
        } else {
          // Default to free plan
          setSubscription({
            planId: 'free',
            planName: 'Free',
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false
          })
        }

      } catch (err) {
        console.error('Error fetching subscription:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user, isLoaded])

  const updateSubscription = async (planId: string) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/clerk/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId })
      })

      if (!response.ok) {
        throw new Error('Failed to update subscription')
      }

      const result = await response.json()
      
      if (result.success) {
        // Refresh user data to get updated metadata
        await user?.reload()
      }
      
      return result
    } catch (err) {
      console.error('Error updating subscription:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const createCheckoutSession = async (planId: string) => {
    try {
      const response = await fetch('/api/clerk/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          successUrl: `${window.location.origin}/subscription?success=true`,
          cancelUrl: `${window.location.origin}/subscription?canceled=true`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const result = await response.json()
      return result.checkoutUrl
    } catch (err) {
      console.error('Error creating checkout session:', err)
      throw err
    }
  }

  const cancelSubscription = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/clerk/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }

      const result = await response.json()
      
      if (result.success) {
        await user?.reload()
      }
      
      return result
    } catch (err) {
      console.error('Error canceling subscription:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    subscription,
    loading,
    error,
    isLoaded,
    updateSubscription,
    createCheckoutSession,
    cancelSubscription,
    refetch: () => user?.reload()
  }
}