'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SubscriptionOverview } from '@/components/subscription/SubscriptionOverview'
import { PlanSelector } from '@/components/subscription/PlanSelector'
import { UserSubscriptionInfo } from '@/components/subscription/UserSubscriptionInfo'
import { BillingSettings } from '@/components/subscription/BillingSettings'
import { CreditCardIcon, ChartBarIcon, CogIcon } from '@heroicons/react/24/outline'

export default function SubscriptionPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['overview', 'plans', 'settings'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Suscripción</h1>
        <p className="mt-2 text-gray-600">
          Administra tu plan, revisa el uso y actualiza tu suscripción
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <ChartBarIcon className="h-4 w-4" />
            <span>Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center space-x-2">
            <CreditCardIcon className="h-4 w-4" />
            <span>Planes</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <CogIcon className="h-4 w-4" />
            <span>Configuración</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <UserSubscriptionInfo />
            </div>
            <div className="lg:col-span-2">
              <SubscriptionOverview />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <PlanSelector />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <BillingSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}