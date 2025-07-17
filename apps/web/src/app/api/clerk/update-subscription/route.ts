import { NextRequest, NextResponse } from 'next/server'
import { setSubscription } from '@/lib/subscription-storage'

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Starting subscription update...')
    
    const body = await req.json()
    const { planId, userId } = body
    
    // For now, use a test user ID since we removed auth middleware
    const targetUserId = userId || 'test_user_id'
    
    console.log('🔍 Request body:', { planId, userId: targetUserId })
    
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    // Store subscription in memory (simulating Clerk metadata update)
    const subscriptionData = {
      subscriptionPlan: planId,
      subscriptionStatus: 'active',
      subscriptionStart: new Date().toISOString(),
      subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
    
    setSubscription(targetUserId, subscriptionData)
    
    console.log(`✅ Updated subscription for user ${targetUserId} to plan ${planId}`)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Subscription updated successfully',
        planId,
        userId: targetUserId,
        subscriptionData
      }
    })

  } catch (error) {
    console.error('❌ Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}