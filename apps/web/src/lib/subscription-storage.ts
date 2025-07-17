// Shared in-memory storage for subscription data
// In production, this would be replaced with Clerk's real billing system
export const USER_SUBSCRIPTIONS = new Map()

export interface SubscriptionData {
  subscriptionPlan: string
  subscriptionStatus: string
  subscriptionStart: string
  subscriptionEnd: string
}

export function getSubscription(userId: string): SubscriptionData | null {
  return USER_SUBSCRIPTIONS.get(userId) || null
}

export function setSubscription(userId: string, data: SubscriptionData): void {
  USER_SUBSCRIPTIONS.set(userId, data)
}

export function getDefaultSubscription(): SubscriptionData {
  return {
    subscriptionPlan: 'plan_free',
    subscriptionStatus: 'active',
    subscriptionStart: new Date().toISOString(),
    subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
}