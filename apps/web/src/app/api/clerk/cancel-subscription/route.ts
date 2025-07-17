import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@/lib/clerkClient'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🚫 Canceling subscription for user:', userId)

    // Update user metadata to reflect canceled subscription
    try {
      await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: {
          subscription: {
            planId: 'free',
            planName: 'Free',
            status: 'canceled',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancelAtPeriodEnd: true,
            canceledAt: new Date().toISOString()
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Subscription canceled successfully'
      })

    } catch (metadataError) {
      console.error('Error updating user metadata:', metadataError)
      throw new Error('Failed to cancel subscription metadata')
    }

  } catch (error) {
    console.error('Error canceling subscription:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to cancel subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}