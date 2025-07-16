'use client'

import { UserSubscriptionInfo } from '@/components/subscription/UserSubscriptionInfo'
import { SubscriptionOverview } from '@/components/subscription/SubscriptionOverview'
import { UserPlanCard } from '@/components/user/UserPlanCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ChartBarIcon, 
  MapIcon, 
  ClipboardDocumentListIcon,
  CogIcon,
  CreditCardIcon 
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Resumen de tu cuenta y actividad agrícola
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Info and Quick Stats */}
        <div className="space-y-6">
          <UserPlanCard />
          
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapIcon className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Parcelas</span>
                  </div>
                  <span className="font-semibold">12</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ClipboardDocumentListIcon className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Actividades</span>
                  </div>
                  <span className="font-semibold">248</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ChartBarIcon className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Rendimiento</span>
                  </div>
                  <span className="font-semibold">+15%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Subscription Overview */}
        <div className="lg:col-span-2">
          <SubscriptionOverview />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <MapIcon className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Nueva parcela registrada</p>
                  <p className="text-sm text-gray-600">Parcela "Campo Norte" - 2.5 hectáreas</p>
                </div>
                <div className="text-sm text-gray-500">Hace 2 horas</div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <ClipboardDocumentListIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Actividad de siembra completada</p>
                  <p className="text-sm text-gray-600">Trigo de invierno - Parcela Sur</p>
                </div>
                <div className="text-sm text-gray-500">Ayer</div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <ChartBarIcon className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Informe mensual generado</p>
                  <p className="text-sm text-gray-600">Análisis de rendimiento - Junio 2025</p>
                </div>
                <div className="text-sm text-gray-500">Hace 3 días</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Link 
                href="/parcelas" 
                className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                <MapIcon className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Nueva Parcela</span>
              </Link>
              
              <Link 
                href="/actividades" 
                className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                <ClipboardDocumentListIcon className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Registrar Actividad</span>
              </Link>
              
              <Link 
                href="/subscription" 
                className="p-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-center"
              >
                <CreditCardIcon className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Suscripción</span>
              </Link>
              
              <Link 
                href="/dashboard" 
                className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center"
              >
                <ChartBarIcon className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Ver Reportes</span>
              </Link>
              
              <Link 
                href="/subscription" 
                className="p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center"
              >
                <CogIcon className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Configuración</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}