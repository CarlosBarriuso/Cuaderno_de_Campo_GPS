// Beta Testing API Routes
// Fecha: 14 Julio 2025

import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { 
  BetaUser, 
  BetaMetric, 
  BetaFeedback, 
  BetaSurveyResponse,
  BetaInterview,
  BetaDashboardStats,
  BetaWeeklyReport,
  validateBetaUser,
  validateBetaMetric,
  validateBetaFeedback,
  validateBetaSurveyResponse,
  validateBetaInterview
} from '../models/betaModels'

const router = Router()

// Mock database - en producción usar Prisma/PostgreSQL
let betaUsers: BetaUser[] = []
let betaMetrics: BetaMetric[] = []
let betaFeedback: BetaFeedback[] = []
let betaSurveys: BetaSurveyResponse[] = []
let betaInterviews: BetaInterview[] = []

// === BETA USER MANAGEMENT ===

// POST /api/beta/apply - Aplicación al programa beta
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const applicationData = {
      id: uuidv4(),
      clerkUserId: req.body.clerkUserId || 'pending',
      email: req.body.email,
      nombre: req.body.nombre,
      telefono: req.body.telefono,
      provincia: req.body.provincia,
      cultivos: req.body.cultivos,
      hectareas: req.body.hectareas,
      motivacion: req.body.motivacion,
      
      // Auto-assign based on data
      segmento: determineSegmento(req.body),
      prioridad: determinePrioridad(req.body),
      
      fechaAplicacion: new Date(),
      status: 'aplicado' as const,
      canalReclutamiento: req.body.canal || 'web_direct',
      cooperativaId: req.body.cooperativaId,
      referidoPor: req.body.referidoPor,
      
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const betaUser = validateBetaUser(applicationData)
    betaUsers.push(betaUser)

    // Send notification email (mock)
    await sendBetaApplicationNotification(betaUser)

    res.status(201).json({
      success: true,
      message: 'Aplicación al programa beta recibida exitosamente',
      data: {
        id: betaUser.id,
        status: betaUser.status,
        estimatedResponse: '48 horas'
      }
    })

  } catch (error) {
    console.error('Error en aplicación beta:', error)
    res.status(400).json({
      success: false,
      message: 'Error procesando aplicación',
      error: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
})

// GET /api/beta/users - Listar usuarios beta (admin)
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { status, segmento, provincia } = req.query

    let filteredUsers = betaUsers

    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status)
    }
    if (segmento) {
      filteredUsers = filteredUsers.filter(user => user.segmento === segmento)
    }
    if (provincia) {
      filteredUsers = filteredUsers.filter(user => user.provincia === provincia)
    }

    res.json({
      success: true,
      data: filteredUsers,
      total: filteredUsers.length,
      filters: { status, segmento, provincia }
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo usuarios beta'
    })
  }
})

// PUT /api/beta/users/:id/status - Actualizar status usuario
router.put('/users/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status, notas } = req.body

    const userIndex = betaUsers.findIndex(user => user.id === id)
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Usuario beta no encontrado'
      })
    }

    betaUsers[userIndex] = {
      ...betaUsers[userIndex],
      status,
      updatedAt: new Date()
    }

    // Update timeline dates based on status
    if (status === 'seleccionado') {
      betaUsers[userIndex].fechaSeleccion = new Date()
    } else if (status === 'activo') {
      betaUsers[userIndex].fechaActivacion = new Date()
    }

    // Send status update notification
    await sendStatusUpdateNotification(betaUsers[userIndex], notas)

    res.json({
      success: true,
      message: 'Status actualizado exitosamente',
      data: betaUsers[userIndex]
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error actualizando status'
    })
  }
})

// === METRICS TRACKING ===

// POST /api/beta/metrics - Registrar métricas de uso
router.post('/metrics', async (req: Request, res: Response) => {
  try {
    const metricData = {
      id: uuidv4(),
      betaUserId: req.body.betaUserId,
      fecha: new Date(),
      
      // Usage metrics
      sesionesApp: req.body.sesionesApp || 0,
      tiempoSesionPromedio: req.body.tiempoSesionPromedio || 0,
      parcelasCreadas: req.body.parcelasCreadas || 0,
      actividadesRegistradas: req.body.actividadesRegistradas || 0,
      fotosSubidas: req.body.fotosSubidas || 0,
      
      // Feature usage
      sigpacUsado: req.body.sigpacUsado || false,
      gpsUsado: req.body.gpsUsado || false,
      weatherUsado: req.body.weatherUsado || false,
      ocrUsado: req.body.ocrUsado || false,
      offlineUsado: req.body.offlineUsado || false,
      informesGenerados: req.body.informesGenerados || 0,
      
      // Quality metrics
      actividadesCompletas: req.body.actividadesCompletas || 0,
      erroresReportados: req.body.erroresReportados || 0,
      ticketsSoporte: req.body.ticketsSoporte || 0,
      
      // Technical metrics
      crashesApp: req.body.crashesApp || 0,
      errorsSincronizacion: req.body.errorsSincronizacion || 0,
      tiempoRespuestaApi: req.body.tiempoRespuestaApi || 0,
      
      createdAt: new Date()
    }

    const metric = validateBetaMetric(metricData)
    betaMetrics.push(metric)

    res.status(201).json({
      success: true,
      message: 'Métricas registradas exitosamente',
      data: metric
    })

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error registrando métricas',
      error: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
})

// GET /api/beta/metrics/user/:userId - Métricas de usuario específico
router.get('/metrics/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const userMetrics = betaMetrics.filter(metric => metric.betaUserId === userId)

    // Calculate aggregated stats
    const stats = calculateUserStats(userMetrics)

    res.json({
      success: true,
      data: {
        metrics: userMetrics,
        stats: stats
      }
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo métricas de usuario'
    })
  }
})

// === FEEDBACK SYSTEM ===

// POST /api/beta/feedback - Enviar feedback
router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const feedbackData = {
      id: uuidv4(),
      betaUserId: req.body.betaUserId,
      tipo: req.body.tipo,
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      prioridad: req.body.prioridad || 'media',
      
      // Context
      pantalla: req.body.pantalla,
      pasos: req.body.pasos,
      expectedBehavior: req.body.expectedBehavior,
      actualBehavior: req.body.actualBehavior,
      
      // Technical info
      dispositivo: req.body.dispositivo,
      browser: req.body.browser,
      version: req.body.version,
      screenshot: req.body.screenshot,
      
      status: 'nuevo' as const,
      
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const feedback = validateBetaFeedback(feedbackData)
    betaFeedback.push(feedback)

    // Auto-assign priority based on keywords
    await autoAssignFeedback(feedback)

    res.status(201).json({
      success: true,
      message: 'Feedback recibido exitosamente',
      data: {
        id: feedback.id,
        ticketNumber: `BETA-${feedback.id.slice(0, 8).toUpperCase()}`,
        estimatedResponse: getPriorityResponseTime(feedback.prioridad)
      }
    })

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error enviando feedback'
    })
  }
})

// GET /api/beta/feedback - Listar feedback (admin)
router.get('/feedback', async (req: Request, res: Response) => {
  try {
    const { status, tipo, prioridad } = req.query

    let filteredFeedback = betaFeedback

    if (status) {
      filteredFeedback = filteredFeedback.filter(fb => fb.status === status)
    }
    if (tipo) {
      filteredFeedback = filteredFeedback.filter(fb => fb.tipo === tipo)
    }
    if (prioridad) {
      filteredFeedback = filteredFeedback.filter(fb => fb.prioridad === prioridad)
    }

    // Sort by priority and date
    filteredFeedback.sort((a, b) => {
      const priorityOrder = { 'critica': 4, 'alta': 3, 'media': 2, 'baja': 1 }
      const aPriority = priorityOrder[a.prioridad]
      const bPriority = priorityOrder[b.prioridad]
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    res.json({
      success: true,
      data: filteredFeedback,
      total: filteredFeedback.length,
      stats: {
        nuevo: betaFeedback.filter(fb => fb.status === 'nuevo').length,
        en_revision: betaFeedback.filter(fb => fb.status === 'en_revision').length,
        resuelto: betaFeedback.filter(fb => fb.status === 'resuelto').length
      }
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo feedback'
    })
  }
})

// === SURVEYS ===

// POST /api/beta/survey - Enviar respuesta survey semanal
router.post('/survey', async (req: Request, res: Response) => {
  try {
    const surveyData = {
      id: uuidv4(),
      betaUserId: req.body.betaUserId,
      semana: req.body.semana,
      fechaRespuesta: new Date(),
      
      // Usage questions
      frecuenciaUso: req.body.frecuenciaUso,
      funcionalidadMasUsada: req.body.funcionalidadMasUsada,
      problemasExperimentados: req.body.problemasExperimentados,
      descripcionProblemas: req.body.descripcionProblemas,
      
      // Satisfaction
      satisfaccionSemanal: req.body.satisfaccionSemanal,
      facilidadUso: req.body.facilidadUso,
      utilidadPercibida: req.body.utilidadPercibida,
      
      // NPS
      npsScore: req.body.npsScore,
      npsRazon: req.body.npsRazon,
      
      // Feature ratings
      sigpacRating: req.body.sigpacRating,
      weatherRating: req.body.weatherRating,
      offlineRating: req.body.offlineRating,
      
      // Open feedback
      mejorAspecto: req.body.mejorAspecto,
      peorAspecto: req.body.peorAspecto,
      sugerenciasMejora: req.body.sugerenciasMejora,
      
      // Commercial
      dispuestoAgar: req.body.dispuestoAgar,
      precioMaximoMensual: req.body.precioMaximoMensual,
      recomendaria: req.body.recomendaria,
      
      createdAt: new Date()
    }

    const survey = validateBetaSurveyResponse(surveyData)
    betaSurveys.push(survey)

    res.status(201).json({
      success: true,
      message: 'Survey completado exitosamente',
      data: survey
    })

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error enviando survey'
    })
  }
})

// === DASHBOARD & REPORTING ===

// GET /api/beta/dashboard - Dashboard principal admin
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const stats: BetaDashboardStats = calculateDashboardStats()

    res.json({
      success: true,
      data: stats
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo dashboard'
    })
  }
})

// GET /api/beta/reports/weekly/:week - Reporte semanal
router.get('/reports/weekly/:week', async (req: Request, res: Response) => {
  try {
    const week = parseInt(req.params.week)
    const report: BetaWeeklyReport = generateWeeklyReport(week)

    res.json({
      success: true,
      data: report
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generando reporte semanal'
    })
  }
})

// === HELPER FUNCTIONS ===

function determineSegmento(data: any): 'individual' | 'cooperativa' | 'tecnico' {
  if (data.email?.includes('cooperativa') || data.email?.includes('coop')) {
    return 'cooperativa'
  }
  if (data.email?.includes('atria') || data.email?.includes('tecnico')) {
    return 'tecnico'
  }
  return 'individual'
}

function determinePrioridad(data: any): 'alta' | 'media' | 'baja' {
  const hectareas = data.hectareas
  if (hectareas?.includes('200+') || hectareas?.includes('500+')) {
    return 'alta'
  }
  if (hectareas?.includes('50-') || hectareas?.includes('100-')) {
    return 'media'
  }
  return 'baja'
}

async function sendBetaApplicationNotification(user: BetaUser) {
  // Mock email notification
  console.log(`📧 Beta application notification sent to ${user.email}`)
}

async function sendStatusUpdateNotification(user: BetaUser, notas?: string) {
  // Mock status update notification
  console.log(`📧 Status update notification sent to ${user.email}: ${user.status}`)
}

async function autoAssignFeedback(feedback: BetaFeedback) {
  // Auto-assign based on keywords
  const criticalKeywords = ['crash', 'error', 'no funciona', 'perdidos', 'bloqueado']
  const highKeywords = ['lento', 'dificil', 'confuso', 'problema']
  
  const description = feedback.descripcion.toLowerCase()
  
  if (criticalKeywords.some(keyword => description.includes(keyword))) {
    feedback.prioridad = 'critica'
  } else if (highKeywords.some(keyword => description.includes(keyword))) {
    feedback.prioridad = 'alta'
  }
}

function getPriorityResponseTime(prioridad: string): string {
  switch (prioridad) {
    case 'critica': return '2 horas'
    case 'alta': return '24 horas'
    case 'media': return '72 horas'
    default: return '1 semana'
  }
}

function calculateUserStats(metrics: BetaMetric[]) {
  if (metrics.length === 0) return null

  const totalSessions = metrics.reduce((sum, m) => sum + m.sesionesApp, 0)
  const avgSessionTime = metrics.reduce((sum, m) => sum + m.tiempoSesionPromedio, 0) / metrics.length
  const totalActivities = metrics.reduce((sum, m) => sum + m.actividadesRegistradas, 0)
  
  return {
    totalSessions,
    avgSessionTime: Math.round(avgSessionTime),
    totalActivities,
    lastActive: metrics[metrics.length - 1]?.fecha
  }
}

function calculateDashboardStats(): BetaDashboardStats {
  const totalUsuarios = betaUsers.length
  const usuariosActivos = betaUsers.filter(u => u.status === 'activo').length
  const tasaActivacion = usuariosActivos / totalUsuarios || 0
  
  const surveys = betaSurveys
  const npsPromedio = surveys.length > 0 
    ? surveys.reduce((sum, s) => sum + s.npsScore, 0) / surveys.length 
    : 0

  const ticketsSoporte = betaFeedback.filter(f => f.status !== 'resuelto').length

  return {
    totalUsuarios,
    usuariosActivos,
    tasaActivacion: Math.round(tasaActivacion * 100) / 100,
    npsPromedio: Math.round(npsPromedio * 10) / 10,
    ticketsSoporte,
    featuresPopulares: [
      { feature: 'SIGPAC', adoption: 0.85 },
      { feature: 'GPS Tracking', adoption: 0.78 },
      { feature: 'Weather', adoption: 0.65 },
      { feature: 'OCR', adoption: 0.45 },
      { feature: 'Offline', adoption: 0.55 }
    ],
    cohortPerformance: [
      { cohort: 'Cooperativas', retencion: 0.80, satisfaccion: 4.2 },
      { cohort: 'Individuales', retencion: 0.75, satisfaccion: 4.0 },
      { cohort: 'Técnicos', retencion: 0.90, satisfaccion: 4.5 }
    ]
  }
}

function generateWeeklyReport(week: number): BetaWeeklyReport {
  // Mock weekly report - en producción calcular de datos reales
  return {
    semana: week,
    fechaInicio: `2025-07-${7 + (week - 1) * 7}`,
    fechaFin: `2025-07-${13 + (week - 1) * 7}`,
    
    adoption: {
      nuevosUsuarios: 8,
      usuariosActivos: 42,
      onboardingCompletado: 38,
      primeraActividad: 35
    },
    
    engagement: {
      sesionesPromedio: 4.2,
      tiempoSesionPromedio: 18.5,
      actividadesPorUsuario: 6.8,
      featuresUsadas: {
        'SIGPAC': 35,
        'GPS': 40,
        'Weather': 28,
        'OCR': 18,
        'Offline': 22
      }
    },
    
    satisfaction: {
      npsScore: 65,
      satisfaccionPromedio: 4.1,
      ticketsSoporte: 12,
      bugsReportados: 5
    },
    
    commercial: {
      dispuestosPagar: 28,
      precioPromedio: 45,
      recomendaciones: 35
    },
    
    insights: {
      top3Positivos: [
        'SIGPAC integration muy valorada',
        'Facilidad de uso superior a competencia',
        'Soporte técnico excelente'
      ],
      top3Negativos: [
        'App móvil ocasionalmente lenta',
        'Funcionalidad offline necesita mejoras',
        'Más tutoriales para funciones avanzadas'
      ],
      accionesRequeridas: [
        'Optimizar performance app móvil',
        'Mejorar sync offline',
        'Crear video tutorials'
      ]
    }
  }
}

export default router