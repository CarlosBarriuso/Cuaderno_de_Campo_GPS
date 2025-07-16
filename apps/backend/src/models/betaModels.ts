// Beta Testing Models - Sistema de métricas y feedback
// Fecha: 14 Julio 2025

import { z } from 'zod'

// === BETA USER TRACKING ===

export const BetaUserSchema = z.object({
  id: z.string().uuid(),
  clerkUserId: z.string(),
  email: z.string().email(),
  nombre: z.string().min(2),
  telefono: z.string(),
  provincia: z.string(),
  cultivos: z.string(),
  hectareas: z.string(),
  motivacion: z.string(),
  
  // Segmentación
  segmento: z.enum(['individual', 'cooperativa', 'tecnico']),
  prioridad: z.enum(['alta', 'media', 'baja']),
  
  // Timeline
  fechaAplicacion: z.date(),
  fechaSeleccion: z.date().optional(),
  fechaOnboarding: z.date().optional(),
  fechaActivacion: z.date().optional(),
  
  // Status tracking
  status: z.enum([
    'aplicado',
    'seleccionado', 
    'onboarding',
    'activo',
    'inactivo',
    'completado'
  ]),
  
  // Metadata
  canalReclutamiento: z.string(),
  cooperativaId: z.string().optional(),
  referidoPor: z.string().optional(),
  
  createdAt: z.date(),
  updatedAt: z.date()
})

export type BetaUser = z.infer<typeof BetaUserSchema>

// === BETA METRICS TRACKING ===

export const BetaMetricSchema = z.object({
  id: z.string().uuid(),
  betaUserId: z.string().uuid(),
  fecha: z.date(),
  
  // Adoption Metrics
  sesionesApp: z.number().int().min(0),
  tiempoSesionPromedio: z.number().min(0), // minutos
  parcelasCreadas: z.number().int().min(0),
  actividadesRegistradas: z.number().int().min(0),
  fotosSubidas: z.number().int().min(0),
  
  // Feature Usage
  sigpacUsado: z.boolean(),
  gpsUsado: z.boolean(),
  weatherUsado: z.boolean(),
  ocrUsado: z.boolean(),
  offlineUsado: z.boolean(),
  informesGenerados: z.number().int().min(0),
  
  // Engagement Quality
  actividadesCompletas: z.number().int().min(0),
  erroresReportados: z.number().int().min(0),
  ticketsSoporte: z.number().int().min(0),
  
  // Technical Health
  crashesApp: z.number().int().min(0),
  errorsSincronizacion: z.number().int().min(0),
  tiempoRespuestaApi: z.number().min(0), // milliseconds
  
  createdAt: z.date()
})

export type BetaMetric = z.infer<typeof BetaMetricSchema>

// === FEEDBACK SYSTEM ===

export const BetaFeedbackSchema = z.object({
  id: z.string().uuid(),
  betaUserId: z.string().uuid(),
  tipo: z.enum([
    'bug_report',
    'feature_request', 
    'improvement_suggestion',
    'user_experience',
    'performance_issue',
    'general_feedback'
  ]),
  
  // Content
  titulo: z.string().min(5).max(100),
  descripcion: z.string().min(10).max(2000),
  prioridad: z.enum(['baja', 'media', 'alta', 'critica']),
  
  // Context
  pantalla: z.string().optional(), // página/pantalla donde ocurrió
  pasos: z.string().optional(), // pasos para reproducir
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  
  // Technical info
  dispositivo: z.string().optional(),
  browser: z.string().optional(),
  version: z.string().optional(),
  screenshot: z.string().optional(), // URL a screenshot
  
  // Status tracking
  status: z.enum(['nuevo', 'en_revision', 'en_desarrollo', 'resuelto', 'cerrado']),
  asignadoA: z.string().optional(),
  fechaResolucion: z.date().optional(),
  notasInternas: z.string().optional(),
  
  // User satisfaction
  facilidadReporte: z.number().min(1).max(5).optional(), // qué fácil fue reportar
  satisfaccionRespuesta: z.number().min(1).max(5).optional(), // satisfacción con respuesta
  
  createdAt: z.date(),
  updatedAt: z.date()
})

export type BetaFeedback = z.infer<typeof BetaFeedbackSchema>

// === WEEKLY SURVEYS ===

export const BetaSurveyResponseSchema = z.object({
  id: z.string().uuid(),
  betaUserId: z.string().uuid(),
  semana: z.number().int().min(1).max(6),
  fechaRespuesta: z.date(),
  
  // Usage Questions
  frecuenciaUso: z.enum(['0', '1', '2-3', '4-5', '6-10', '10+']),
  funcionalidadMasUsada: z.string(),
  problemasExperimentados: z.boolean(),
  descripcionProblemas: z.string().optional(),
  
  // Satisfaction
  satisfaccionSemanal: z.number().min(1).max(5),
  facilidadUso: z.number().min(1).max(5),
  utilidadPercibida: z.number().min(1).max(5),
  
  // NPS
  npsScore: z.number().min(0).max(10),
  npsRazon: z.string().optional(),
  
  // Feature specific
  sigpacRating: z.number().min(1).max(5).optional(),
  weatherRating: z.number().min(1).max(5).optional(),
  offlineRating: z.number().min(1).max(5).optional(),
  
  // Open feedback
  mejorAspecto: z.string().optional(),
  peorAspecto: z.string().optional(),
  sugerenciasMejora: z.string().optional(),
  
  // Commercial signals
  dispuestoAgar: z.boolean().optional(),
  precioMaximoMensual: z.number().min(0).optional(),
  recomendaria: z.boolean().optional(),
  
  createdAt: z.date()
})

export type BetaSurveyResponse = z.infer<typeof BetaSurveyResponseSchema>

// === INTERVIEW INSIGHTS ===

export const BetaInterviewSchema = z.object({
  id: z.string().uuid(),
  betaUserId: z.string().uuid(),
  tipo: z.enum(['checkin_semanal', 'deep_dive', 'focus_group', 'final_evaluation']),
  fecha: z.date(),
  duracion: z.number().min(5).max(120), // minutos
  
  // Interview metadata
  entrevistador: z.string(),
  metodo: z.enum(['telefono', 'videollamada', 'presencial']),
  grabacion: z.boolean(),
  consentimiento: z.boolean(),
  
  // Key insights
  insightsPositivos: z.array(z.string()),
  insightsNegativos: z.array(z.string()),
  casosUsoNovedosos: z.array(z.string()),
  competenciaComparison: z.array(z.string()),
  
  // Product feedback
  featuresDeseadas: z.array(z.string()),
  featuresInnecesarias: z.array(z.string()),
  mejoresIntegraciones: z.array(z.string()),
  problemasUsabilidad: z.array(z.string()),
  
  // Commercial insights
  valorPercibido: z.number().min(1).max(5),
  pricingSensitivity: z.string(),
  conversionLikelihood: z.number().min(0).max(10),
  referralPotential: z.number().min(0).max(10),
  
  // Workflow insights
  workflowActual: z.string(),
  workflowIdeal: z.string(),
  tiempoAhorrado: z.string(),
  erroresReducidos: z.string(),
  
  // Notes
  notasTranscripcion: z.string().optional(),
  accionesFollowup: z.array(z.string()),
  
  createdAt: z.date(),
  updatedAt: z.date()
})

export type BetaInterview = z.infer<typeof BetaInterviewSchema>

// === COHORT ANALYSIS ===

export const BetaCohortSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(), // "Cooperativas Andalucia", "Cereales Castilla Leon", etc.
  descripcion: z.string(),
  
  // Cohort definition
  criterios: z.object({
    segmento: z.array(z.string()).optional(),
    provincia: z.array(z.string()).optional(),
    cultivos: z.array(z.string()).optional(),
    hectareas: z.array(z.string()).optional(),
    canalReclutamiento: z.array(z.string()).optional()
  }),
  
  // Size
  usuariosTarget: z.number().int().min(1),
  usuariosActuales: z.number().int().min(0),
  
  // Performance
  tasaActivacion: z.number().min(0).max(1), // % que completó onboarding
  tasaRetencion: z.object({
    semana1: z.number().min(0).max(1),
    semana2: z.number().min(0).max(1),
    semana3: z.number().min(0).max(1),
    semana4: z.number().min(0).max(1),
    semana5: z.number().min(0).max(1),
    semana6: z.number().min(0).max(1)
  }),
  
  // Satisfaction
  npsPromedio: z.number().min(-100).max(100),
  satisfaccionPromedio: z.number().min(1).max(5),
  
  // Commercial
  conversionRate: z.number().min(0).max(1),
  precioAceptacion: z.number().min(0),
  
  createdAt: z.date(),
  updatedAt: z.date()
})

export type BetaCohort = z.infer<typeof BetaCohortSchema>

// === API RESPONSE TYPES ===

export interface BetaDashboardStats {
  totalUsuarios: number
  usuariosActivos: number
  tasaActivacion: number
  npsPromedio: number
  ticketsSoporte: number
  featuresPopulares: Array<{
    feature: string
    adoption: number
  }>
  cohortPerformance: Array<{
    cohort: string
    retencion: number
    satisfaccion: number
  }>
}

export interface BetaWeeklyReport {
  semana: number
  fechaInicio: string
  fechaFin: string
  
  adoption: {
    nuevosUsuarios: number
    usuariosActivos: number
    onboardingCompletado: number
    primeraActividad: number
  }
  
  engagement: {
    sesionesPromedio: number
    tiempoSesionPromedio: number
    actividadesPorUsuario: number
    featuresUsadas: Record<string, number>
  }
  
  satisfaction: {
    npsScore: number
    satisfaccionPromedio: number
    ticketsSoporte: number
    bugsReportados: number
  }
  
  commercial: {
    dispuestosPagar: number
    precioPromedio: number
    recomendaciones: number
  }
  
  insights: {
    top3Positivos: string[]
    top3Negativos: string[]
    accionesRequeridas: string[]
  }
}

// === VALIDATION HELPERS ===

export const validateBetaUser = (data: unknown): BetaUser => {
  return BetaUserSchema.parse(data)
}

export const validateBetaMetric = (data: unknown): BetaMetric => {
  return BetaMetricSchema.parse(data)
}

export const validateBetaFeedback = (data: unknown): BetaFeedback => {
  return BetaFeedbackSchema.parse(data)
}

export const validateBetaSurveyResponse = (data: unknown): BetaSurveyResponse => {
  return BetaSurveyResponseSchema.parse(data)
}

export const validateBetaInterview = (data: unknown): BetaInterview => {
  return BetaInterviewSchema.parse(data)
}