import { NextRequest, NextResponse } from 'next/server'
import { getSubscription, getDefaultSubscription } from '@/lib/subscription-storage'

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Getting subscription data...')
    
    // For now, use test user ID since we removed auth middleware
    const userId = 'test_user_id'
    
    console.log('🔍 Getting subscription for userId:', userId)
    
    // Get subscription from memory
    const subscriptionData = getSubscription(userId) || getDefaultSubscription()
    
    console.log('📊 Found subscription data:', subscriptionData)
    
    return NextResponse.json({
      success: true,
      data: subscriptionData
    })

  } catch (error) {
    console.error('❌ Error getting subscription:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    )
  }
}