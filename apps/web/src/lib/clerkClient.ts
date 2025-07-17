import { createClerkClient } from '@clerk/clerk-sdk-node'

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY is required')
}

// Create Clerk client instance
export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

// Plan mapping for billing
export const CLERK_PLAN_IDS = {
  free: null, // Free plan doesn't have a Clerk plan ID
  basic: 'cplan_300QmNaQw6zwHRX3I2LBWRWofQb',
  professional: 'cplan_300R6vZrDvKSHXZIQXf7teqUV7Q', 
  enterprise: 'cplan_300RG2L7Fl1HieWjKR4fVXwBtZU'
} as const

export type PlanKey = keyof typeof CLERK_PLAN_IDS