import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkClient, CLERK_PLAN_IDS, PlanKey } from '@/lib/clerkClient'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { planId, successUrl, cancelUrl } = await request.json()

    const clerkPlanId = CLERK_PLAN_IDS[planId as PlanKey]
    
    if (!clerkPlanId && planId !== 'free') {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      )
    }

    console.log('🏪 Creating checkout session:', {
      userId,
      planId,
      clerkPlanId,
      successUrl,
      cancelUrl
    })

    // For Clerk Billing, we update user metadata directly
    // This simulates a subscription change
    try {
      await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: {
          subscription: {
            planId,
            planName: planId.charAt(0).toUpperCase() + planId.slice(1),
            status: 'active',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancelAtPeriodEnd: false
          }
        }
      })

      // In a real implementation with Clerk Billing, you would:
      // 1. Create a Stripe checkout session through Clerk's billing API
      // 2. Return the real checkout URL from Stripe
      
      // For now, we'll redirect back with success since we updated the metadata
      const redirectUrl = `${successUrl}?plan_changed=true&new_plan=${planId}`

      return NextResponse.json({
        success: true,
        checkoutUrl: redirectUrl,
        message: 'Plan updated successfully',
        planChanged: true
      })

    } catch (metadataError) {
      console.error('Error updating user metadata:', metadataError)
      throw new Error('Failed to update subscription metadata')
    }

  } catch (error) {
    console.error('Error creating checkout session:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}