'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
      },
    },
  }))

  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!clerkPublishableKey) {
    console.error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable')
  }

  return (
    <ClerkProvider 
      publishableKey={clerkPublishableKey}
      appearance={{
        variables: {
          colorPrimary: '#16a34a', // green-600
          colorText: '#374151', // gray-700
        },
        elements: {
          formButtonPrimary: 'bg-green-600 hover:bg-green-700 text-white',
          card: 'shadow-lg',
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ClerkProvider>
  )
}