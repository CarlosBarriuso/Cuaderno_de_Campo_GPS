'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi'
import { api } from '@/lib/api'
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  CreditCardIcon 
} from '@heroicons/react/24/outline'

interface Invoice {
  id: string
  date: string
  amount: number
  currency: string
  status: string
  plan: string
  period: string
}

export function BillingHistory() {
  const { isAuthReady } = useAuthenticatedApi()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthReady) {
      loadBillingHistory()
    }
  }, [isAuthReady])

  const loadBillingHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.subscription.billingHistory()
      
      if (response?.success && response.data) {
        setInvoices(response.data.invoices || [])
      }
    } catch (err) {
      console.error('Error loading billing history:', err)
      setError('Error al cargar el historial de facturación')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: 'Pagado', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendiente', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      failed: { label: 'Fallido', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      refunded: { label: 'Reembolsado', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' }
    }

    const config = statusConfig[status] || statusConfig.pending
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const downloadInvoice = (invoiceId: string) => {
    // En una implementación real, esto descargaría el PDF de la factura
    console.log(`Downloading invoice ${invoiceId}`)
    alert(`Descargando factura ${invoiceId} (funcionalidad simulada)`)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando historial de facturación...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">{error}</div>
          <Button 
            onClick={loadBillingHistory} 
            variant="outline" 
            className="mt-4 mx-auto block"
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCardIcon className="h-5 w-5" />
          <span>Historial de Facturación</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>No hay facturas disponibles</p>
            <p className="text-sm">Las facturas aparecerán aquí después de tu primer pago</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600">Total Facturas</div>
                <div className="text-2xl font-bold text-blue-900">{invoices.length}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">Pagadas</div>
                <div className="text-2xl font-bold text-green-900">
                  {invoices.filter(inv => inv.status === 'paid').length}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600">Total Pagado</div>
                <div className="text-2xl font-bold text-purple-900">
                  {formatAmount(
                    invoices
                      .filter(inv => inv.status === 'paid')
                      .reduce((sum, inv) => sum + inv.amount, 0),
                    'EUR'
                  )}
                </div>
              </div>
            </div>

            {/* Invoices List */}
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div 
                  key={invoice.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            Factura #{invoice.id}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(invoice.date)} • {invoice.plan}
                          </div>
                          <div className="text-xs text-gray-500">
                            Periodo: {invoice.period}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatAmount(invoice.amount, invoice.currency)}
                        </div>
                        <div className="mt-1">
                          {getStatusBadge(invoice.status)}
                        </div>
                      </div>
                      
                      {invoice.status === 'paid' && (
                        <Button
                          onClick={() => downloadInvoice(invoice.id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          <span>Descargar</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {invoices.length >= 10 && (
              <div className="text-center pt-4">
                <Button variant="outline" onClick={loadBillingHistory}>
                  Cargar Más Facturas
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}