'use client'

import { useUser } from '@clerk/nextjs'
import { useSubscription } from '@/hooks/useSubscription'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardPlanCard } from '@/components/subscription/DashboardPlanCard'
import Link from 'next/link'

export default function Home() {
  const { isSignedIn, user } = useUser()
  const { subscription, getPlanDisplayName, getPlanColor } = useSubscription()

  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ¡Bienvenido, {user?.firstName || 'Usuario'}! 🌾
            </h1>
            <p className="text-xl text-gray-600">
              Gestiona tu explotación agrícola de forma profesional y eficiente
            </p>
            {subscription && (
              <div className="mt-4 flex justify-center">
                <Badge className={`${getPlanColor(subscription.plan)} text-sm px-3 py-1`}>
                  Plan {getPlanDisplayName(subscription.plan)}
                </Badge>
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Plan Card - Prominent placement */}
            <div className="lg:col-span-1">
              <DashboardPlanCard />
            </div>
            
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/dashboard" className="group">
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">📊</div>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-green-600">Dashboard</h3>
                      <p className="text-gray-600 text-sm">Resumen de tu actividad</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/parcelas" className="group">
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">🌾</div>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-green-600">Parcelas</h3>
                      <p className="text-gray-600 text-sm">Gestiona tus parcelas</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/actividades" className="group">
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">📝</div>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-green-600">Actividades</h3>
                      <p className="text-gray-600 text-sm">Registra actividades</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/mapa" className="group">
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">🗺️</div>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-green-600">Mapas</h3>
                      <p className="text-gray-600 text-sm">Visualiza parcelas</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold text-center mb-8">Características de tu Plan</h2>
            {subscription && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {subscription.max_parcelas}
                  </div>
                  <div className="text-gray-600">Parcelas máximas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {subscription.max_actividades}
                  </div>
                  <div className="text-gray-600">Actividades por mes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {subscription.storage_gb}GB
                  </div>
                  <div className="text-gray-600">Almacenamiento</div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold text-center mb-8">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/parcelas" className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center">
                <div className="text-3xl mb-2">🌾</div>
                <h3 className="font-semibold">Gestionar Parcelas</h3>
                <p className="text-sm opacity-90">Registra y organiza tus parcelas</p>
              </Link>
              
              <Link href="/actividades" className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center">
                <div className="text-3xl mb-2">📝</div>
                <h3 className="font-semibold">Registrar Actividad</h3>
                <p className="text-sm opacity-90">Documenta tu trabajo diario</p>
              </Link>
              
              <Link href="/subscription" className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center">
                <div className="text-3xl mb-2">💳</div>
                <h3 className="font-semibold">Mejorar Plan</h3>
                <p className="text-sm opacity-90">Accede a más funcionalidades</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🌾 Cuaderno de Campo GPS
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sistema integral de gestión agrícola que permite registrar, gestionar y analizar 
            actividades de campo mediante geolocalización GPS
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">25+</div>
            <div className="text-gray-600">Parcelas Registradas</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">156</div>
            <div className="text-gray-600">Actividades</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">247.5</div>
            <div className="text-gray-600">Hectáreas Totales</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">12</div>
            <div className="text-gray-600">Tipos de Cultivo</div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-green-600 text-3xl mb-4">📍</div>
            <h3 className="text-xl font-semibold mb-3">GPS Precisión</h3>
            <p className="text-gray-600">
              Registro de actividades con coordenadas GPS de alta precisión (1-3 metros)
              para trazabilidad completa.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-blue-600 text-3xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-3">App Móvil</h3>
            <p className="text-gray-600">
              Aplicación móvil con funcionalidad offline para registrar actividades 
              directamente desde el campo.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-yellow-600 text-3xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold mb-3">Mapas Interactivos</h3>
            <p className="text-gray-600">
              Visualización de parcelas en mapas interactivos con información 
              detallada y análisis geoespacial.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-purple-600 text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3">Analytics Avanzado</h3>
            <p className="text-gray-600">
              Dashboards con métricas clave, análisis de rentabilidad y 
              comparativas históricas.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-red-600 text-3xl mb-4">🌾</div>
            <h3 className="text-xl font-semibold mb-3">Cultivos Específicos</h3>
            <p className="text-gray-600">
              Formularios adaptados para cereales, frutales, hortalizas, 
              olivar y viñedo con validaciones específicas.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-indigo-600 text-3xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-3">Cumplimiento PAC</h3>
            <p className="text-gray-600">
              Generación automática de informes para cumplimiento de la 
              Política Agrícola Común (PAC).
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-green-600 rounded-lg shadow-lg p-8 text-center text-white mb-12">
          <h2 className="text-3xl font-bold mb-4">¿Listo para digitalizar tu explotación?</h2>
          <p className="text-lg mb-6 opacity-90">
            Comienza a gestionar tus actividades agrícolas de forma profesional y eficiente
          </p>
          <div className="space-x-4">
            <a
              href="/parcelas"
              className="inline-block bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              🌾 Gestionar Parcelas
            </a>
            <a
              href="/actividades"
              className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors"
            >
              📝 Registrar Actividad
            </a>
            <a
              href="/mapa"
              className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors"
            >
              🗺️ Ver Mapa
            </a>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-white rounded-lg shadow p-8">
          <h3 className="text-2xl font-bold text-center mb-8">Stack Tecnológico</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl mb-2">⚛️</div>
              <div className="font-semibold">React Native</div>
              <div className="text-sm text-gray-600">App Móvil</div>
            </div>
            <div>
              <div className="text-2xl mb-2">🌐</div>
              <div className="font-semibold">Next.js</div>
              <div className="text-sm text-gray-600">Frontend Web</div>
            </div>
            <div>
              <div className="text-2xl mb-2">🚀</div>
              <div className="font-semibold">Node.js</div>
              <div className="text-sm text-gray-600">Backend API</div>
            </div>
            <div>
              <div className="text-2xl mb-2">🗄️</div>
              <div className="font-semibold">PostgreSQL</div>
              <div className="text-sm text-gray-600">Base de Datos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}