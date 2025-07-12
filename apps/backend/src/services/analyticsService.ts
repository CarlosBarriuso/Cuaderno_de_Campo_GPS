// analyticsService.ts - Servicio de análisis y métricas agrícolas
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

export interface AnalyticsFilters {
  userId: string;
  parcelaIds?: string[];
  fechaInicio?: Date;
  fechaFin?: Date;
  tipoActividad?: string[];
  tipoCultivo?: string[];
}

export interface CostosAnalysis {
  total: number;
  productos: number;
  manoObra: number;
  maquinaria: number;
  combustible: number;
  otros: number;
  promedioPorHectarea: number;
  tendencia: 'aumentando' | 'disminuyendo' | 'estable';
  comparativoPeriodoAnterior: number;
}

export interface RendimientoAnalysis {
  totalProduccion: number;
  rendimientoPorHectarea: number;
  rendimientoPromedio: number;
  eficienciaOperativa: number;
  factorCalidad: number;
  tendencia: 'mejorando' | 'empeorando' | 'estable';
  comparativoPeriodoAnterior: number;
}

export interface RentabilidadAnalysis {
  ingresosBrutos: number;
  costosTotales: number;
  margenBruto: number;
  margenNeto: number;
  roi: number; // Return on Investment
  roiPorHectarea: number;
  puntoEquilibrio: number;
  tendencia: 'positiva' | 'negativa' | 'estable';
  proyeccionAnual: number;
}

export interface ComparativaTemporalData {
  periodo: string;
  costos: number;
  ingresos: number;
  margen: number;
  rendimiento: number;
  superficie: number;
}

export interface BenchmarkingData {
  metrica: string;
  valorUsuario: number;
  valorPromedio: number;
  valorMejor: number;
  posicionPercentil: number;
  recomendacion: string;
}

export interface AlertaRentabilidad {
  tipo: 'critica' | 'advertencia' | 'oportunidad';
  titulo: string;
  descripcion: string;
  impactoEconomico: number;
  accionRecomendada: string;
  prioridad: number;
}

export interface DashboardMetrics {
  resumenPeriodo: {
    ingresosTotales: number;
    costosTotales: number;
    margenBruto: number;
    superficieGestionada: number;
    actividadesRealizadas: number;
    cambioRespectoPeriodoAnterior: number;
  };
  indicadoresClave: {
    costoPorHectarea: number;
    rendimientoPorHectarea: number;
    margenPorHectarea: number;
    eficienciaOperativa: number;
    indiceRentabilidad: number;
  };
  distribucionCostos: {
    categoria: string;
    porcentaje: number;
    valor: number;
  }[];
  tendencias: ComparativaTemporalData[];
  alertas: AlertaRentabilidad[];
}

class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Análisis completo de costos
   */
  async analyzeCosts(filters: AnalyticsFilters): Promise<CostosAnalysis> {
    try {
      const actividades = await this.getActivitiesData(filters);
      
      let totalCostos = 0;
      let costosProductos = 0;
      let costosManoObra = 0;
      let costosMaquinaria = 0;
      let costosCombustible = 0;
      let costosOtros = 0;
      let superficieTotal = 0;

      // Calcular costos por actividad
      for (const actividad of actividades) {
        const costos = actividad.costos as any;
        if (costos) {
          totalCostos += costos.total || 0;
          costosProductos += costos.productos || 0;
          costosManoObra += costos.mano_obra || 0;
          costosMaquinaria += costos.maquinaria || 0;
          costosCombustible += costos.combustible || 0;
          costosOtros += costos.otros || 0;
        }
        
        if (actividad.parcela) {
          superficieTotal += actividad.parcela.superficie;
        }
      }

      // Calcular promedio por hectárea
      const promedioPorHectarea = superficieTotal > 0 ? totalCostos / superficieTotal : 0;

      // Calcular tendencia comparando con período anterior
      const periodoAnterior = await this.calculatePreviousPeriodCosts(filters);
      const tendencia = this.calculateTrend(totalCostos, periodoAnterior.total);
      const comparativo = this.calculatePercentageChange(totalCostos, periodoAnterior.total);

      return {
        total: Math.round(totalCostos * 100) / 100,
        productos: Math.round(costosProductos * 100) / 100,
        manoObra: Math.round(costosManoObra * 100) / 100,
        maquinaria: Math.round(costosMaquinaria * 100) / 100,
        combustible: Math.round(costosCombustible * 100) / 100,
        otros: Math.round(costosOtros * 100) / 100,
        promedioPorHectarea: Math.round(promedioPorHectarea * 100) / 100,
        tendencia,
        comparativoPeriodoAnterior: Math.round(comparativo * 100) / 100,
      };

    } catch (error) {
      logger.error('Error analyzing costs:', error);
      throw new Error('Error calculando análisis de costos');
    }
  }

  /**
   * Análisis de rendimiento de cultivos
   */
  async analyzeRendimiento(filters: AnalyticsFilters): Promise<RendimientoAnalysis> {
    try {
      const actividades = await this.getActivitiesData(filters, ['cosecha']);
      
      let totalProduccion = 0;
      let superficieTotal = 0;
      let sumaCalidades = 0;
      let contadorCalidades = 0;

      // Calcular producción total y calidad promedio
      for (const actividad of actividades) {
        const resultados = actividad.resultados as any;
        if (resultados?.rendimiento) {
          totalProduccion += resultados.rendimiento;
        }
        
        if (resultados?.calidad) {
          // Convertir calidad textual a numérica (ejemplo: "excelente" = 5, "buena" = 4, etc.)
          const calidadNumerica = this.convertirCalidadANumero(resultados.calidad);
          sumaCalidades += calidadNumerica;
          contadorCalidades++;
        }
        
        if (actividad.parcela) {
          superficieTotal += actividad.parcela.superficie;
        }
      }

      const rendimientoPorHectarea = superficieTotal > 0 ? totalProduccion / superficieTotal : 0;
      const factorCalidad = contadorCalidades > 0 ? sumaCalidades / contadorCalidades : 3; // 3 = calidad media

      // Calcular rendimiento promedio del sector (simulado)
      const rendimientoPromedio = await this.getRendimientoPromediSector(filters);
      const eficienciaOperativa = rendimientoPromedio > 0 ? (rendimientoPorHectarea / rendimientoPromedio) * 100 : 100;

      // Calcular tendencia
      const periodoAnterior = await this.calculatePreviousPeriodRendimiento(filters);
      const tendencia = this.calculateTrendRendimiento(rendimientoPorHectarea, periodoAnterior.rendimientoPorHectarea);
      const comparativo = this.calculatePercentageChange(rendimientoPorHectarea, periodoAnterior.rendimientoPorHectarea);

      return {
        totalProduccion: Math.round(totalProduccion * 100) / 100,
        rendimientoPorHectarea: Math.round(rendimientoPorHectarea * 100) / 100,
        rendimientoPromedio: Math.round(rendimientoPromedio * 100) / 100,
        eficienciaOperativa: Math.round(eficienciaOperativa * 100) / 100,
        factorCalidad: Math.round(factorCalidad * 100) / 100,
        tendencia,
        comparativoPeriodoAnterior: Math.round(comparativo * 100) / 100,
      };

    } catch (error) {
      logger.error('Error analyzing rendimiento:', error);
      throw new Error('Error calculando análisis de rendimiento');
    }
  }

  /**
   * Análisis completo de rentabilidad
   */
  async analyzeRentabilidad(filters: AnalyticsFilters): Promise<RentabilidadAnalysis> {
    try {
      const [costosAnalysis, rendimientoAnalysis] = await Promise.all([
        this.analyzeCosts(filters),
        this.analyzeRendimiento(filters),
      ]);

      // Obtener precios de mercado actuales
      const preciosPromedio = await this.getPreciosPromedioMercado(filters);
      
      // Calcular ingresos brutos
      const ingresosBrutos = rendimientoAnalysis.totalProduccion * preciosPromedio;
      const costosTotales = costosAnalysis.total;
      
      // Calcular márgenes
      const margenBruto = ingresosBrutos - costosTotales;
      const margenNeto = margenBruto * 0.85; // Estimando 15% de gastos generales
      
      // Calcular ROI
      const roi = costosTotales > 0 ? (margenNeto / costosTotales) * 100 : 0;
      
      // ROI por hectárea
      const superficieTotal = await this.getSuperficieTotal(filters);
      const roiPorHectarea = superficieTotal > 0 ? margenNeto / superficieTotal : 0;
      
      // Punto de equilibrio
      const puntoEquilibrio = preciosPromedio > 0 ? costosTotales / preciosPromedio : 0;
      
      // Tendencia y proyección
      const periodoAnterior = await this.calculatePreviousPeriodRentabilidad(filters);
      const tendencia = this.calculateTrendRentabilidad(roi, periodoAnterior.roi);
      
      // Proyección anual basada en tendencia actual
      const proyeccionAnual = this.calculateAnualProjection(margenNeto, filters);

      return {
        ingresosBrutos: Math.round(ingresosBrutos * 100) / 100,
        costosTotales: Math.round(costosTotales * 100) / 100,
        margenBruto: Math.round(margenBruto * 100) / 100,
        margenNeto: Math.round(margenNeto * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        roiPorHectarea: Math.round(roiPorHectarea * 100) / 100,
        puntoEquilibrio: Math.round(puntoEquilibrio * 100) / 100,
        tendencia,
        proyeccionAnual: Math.round(proyeccionAnual * 100) / 100,
      };

    } catch (error) {
      logger.error('Error analyzing rentabilidad:', error);
      throw new Error('Error calculando análisis de rentabilidad');
    }
  }

  /**
   * Genera comparativa temporal
   */
  async generateComparativatemporal(
    filters: AnalyticsFilters,
    periodos: number = 12
  ): Promise<ComparativaTemporalData[]> {
    try {
      const datos: ComparativaTemporalData[] = [];
      const fechaFin = filters.fechaFin || new Date();
      
      for (let i = periodos - 1; i >= 0; i--) {
        const fechaInicioPeriodo = new Date(fechaFin);
        fechaInicioPeriodo.setMonth(fechaInicioPeriodo.getMonth() - i - 1);
        
        const fechaFinPeriodo = new Date(fechaFin);
        fechaFinPeriodo.setMonth(fechaFinPeriodo.getMonth() - i);
        
        const filtrosPeriodo = {
          ...filters,
          fechaInicio: fechaInicioPeriodo,
          fechaFin: fechaFinPeriodo,
        };

        const [costos, rendimiento, rentabilidad] = await Promise.all([
          this.analyzeCosts(filtrosPeriodo),
          this.analyzeRendimiento(filtrosPeriodo),
          this.analyzeRentabilidad(filtrosPeriodo),
        ]);

        const superficie = await this.getSuperficieTotal(filtrosPeriodo);

        datos.push({
          periodo: fechaInicioPeriodo.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short' 
          }),
          costos: costos.total,
          ingresos: rentabilidad.ingresosBrutos,
          margen: rentabilidad.margenNeto,
          rendimiento: rendimiento.rendimientoPorHectarea,
          superficie,
        });
      }

      return datos;

    } catch (error) {
      logger.error('Error generating comparativa temporal:', error);
      throw new Error('Error generando comparativa temporal');
    }
  }

  /**
   * Genera datos de benchmarking
   */
  async generateBenchmarking(filters: AnalyticsFilters): Promise<BenchmarkingData[]> {
    try {
      const [costos, rendimiento, rentabilidad] = await Promise.all([
        this.analyzeCosts(filters),
        this.analyzeRendimiento(filters),
        this.analyzeRentabilidad(filters),
      ]);

      // Datos de benchmarking del sector (simulados con datos realistas)
      const benchmarks: BenchmarkingData[] = [
        {
          metrica: 'Costo por Hectárea',
          valorUsuario: costos.promedioPorHectarea,
          valorPromedio: 850, // €/ha promedio sector
          valorMejor: 650,    // €/ha mejores productores
          posicionPercentil: this.calculatePercentile(costos.promedioPorHectarea, 850, 650, 1200),
          recomendacion: this.getRecommendationCostos(costos.promedioPorHectarea, 850),
        },
        {
          metrica: 'Rendimiento por Hectárea',
          valorUsuario: rendimiento.rendimientoPorHectarea,
          valorPromedio: 4200, // kg/ha promedio
          valorMejor: 6500,    // kg/ha mejores
          posicionPercentil: this.calculatePercentile(rendimiento.rendimientoPorHectarea, 4200, 6500, 2000),
          recomendacion: this.getRecommendationRendimiento(rendimiento.rendimientoPorHectarea, 4200),
        },
        {
          metrica: 'ROI (%)',
          valorUsuario: rentabilidad.roi,
          valorPromedio: 12,   // 12% promedio
          valorMejor: 25,      // 25% mejores
          posicionPercentil: this.calculatePercentile(rentabilidad.roi, 12, 25, -5),
          recomendacion: this.getRecommendationROI(rentabilidad.roi, 12),
        },
        {
          metrica: 'Margen Neto por Hectárea',
          valorUsuario: rentabilidad.roiPorHectarea,
          valorPromedio: 350,  // €/ha
          valorMejor: 800,     // €/ha
          posicionPercentil: this.calculatePercentile(rentabilidad.roiPorHectarea, 350, 800, -100),
          recomendacion: this.getRecommendationMargen(rentabilidad.roiPorHectarea, 350),
        },
      ];

      return benchmarks;

    } catch (error) {
      logger.error('Error generating benchmarking:', error);
      throw new Error('Error generando datos de benchmarking');
    }
  }

  /**
   * Genera alertas de rentabilidad
   */
  async generateAlertas(filters: AnalyticsFilters): Promise<AlertaRentabilidad[]> {
    try {
      const [costos, rendimiento, rentabilidad] = await Promise.all([
        this.analyzeCosts(filters),
        this.analyzeRendimiento(filters),
        this.analyzeRentabilidad(filters),
      ]);

      const alertas: AlertaRentabilidad[] = [];

      // Alerta de costos altos
      if (costos.promedioPorHectarea > 1000) {
        alertas.push({
          tipo: 'critica',
          titulo: 'Costos por Hectárea Elevados',
          descripcion: `Los costos por hectárea (${costos.promedioPorHectarea.toFixed(0)}€/ha) están por encima del promedio del sector (850€/ha).`,
          impactoEconomico: (costos.promedioPorHectarea - 850) * (await this.getSuperficieTotal(filters)),
          accionRecomendada: 'Revisar gastos en productos fitosanitarios y optimizar maquinaria.',
          prioridad: 9,
        });
      }

      // Alerta de bajo rendimiento
      if (rendimiento.eficienciaOperativa < 80) {
        alertas.push({
          tipo: 'advertencia',
          titulo: 'Rendimiento por Debajo del Promedio',
          descripcion: `El rendimiento está un ${(100 - rendimiento.eficienciaOperativa).toFixed(1)}% por debajo del promedio del sector.`,
          impactoEconomico: this.calculateImpactoBajoRendimiento(rendimiento, filters),
          accionRecomendada: 'Analizar técnicas de cultivo y considerar variedades más productivas.',
          prioridad: 7,
        });
      }

      // Alerta de ROI negativo
      if (rentabilidad.roi < 0) {
        alertas.push({
          tipo: 'critica',
          titulo: 'Rentabilidad Negativa',
          descripcion: `El ROI es negativo (${rentabilidad.roi.toFixed(1)}%), indicando pérdidas en la operación.`,
          impactoEconomico: Math.abs(rentabilidad.margenNeto),
          accionRecomendada: 'Revisión urgente de costos y estrategia comercial.',
          prioridad: 10,
        });
      }

      // Alerta de tendencia negativa
      if (costos.tendencia === 'aumentando' && rentabilidad.tendencia === 'negativa') {
        alertas.push({
          tipo: 'advertencia',
          titulo: 'Tendencia Preocupante',
          descripcion: 'Los costos están aumentando mientras la rentabilidad disminuye.',
          impactoEconomico: this.calculateImpactoTendencia(costos, rentabilidad),
          accionRecomendada: 'Implementar medidas de control de costos inmediatamente.',
          prioridad: 8,
        });
      }

      // Alerta de oportunidad
      if (rendimiento.eficienciaOperativa > 120 && rentabilidad.roi > 20) {
        alertas.push({
          tipo: 'oportunidad',
          titulo: 'Excelente Rendimiento',
          descripcion: 'Los resultados están significativamente por encima del promedio del sector.',
          impactoEconomico: this.calculateImpactoPositivo(rendimiento, rentabilidad),
          accionRecomendada: 'Considerar expandir operaciones o replicar estrategias exitosas.',
          prioridad: 6,
        });
      }

      return alertas.sort((a, b) => b.prioridad - a.prioridad);

    } catch (error) {
      logger.error('Error generating alertas:', error);
      throw new Error('Error generando alertas de rentabilidad');
    }
  }

  /**
   * Genera dashboard completo con métricas clave
   */
  async generateDashboard(filters: AnalyticsFilters): Promise<DashboardMetrics> {
    try {
      const [
        costos,
        rendimiento,
        rentabilidad,
        comparativaAnterior,
        comparativaTemporal,
        alertas
      ] = await Promise.all([
        this.analyzeCosts(filters),
        this.analyzeRendimiento(filters),
        this.analyzeRentabilidad(filters),
        this.getPreviousPeriodSummary(filters),
        this.generateComparativatemporal(filters, 6),
        this.generateAlertas(filters),
      ]);

      const superficieTotal = await this.getSuperficieTotal(filters);
      const actividadesTotal = await this.getActividadesCount(filters);

      // Calcular cambio respecto período anterior
      const cambioRespectoPeriodoAnterior = this.calculatePercentageChange(
        rentabilidad.margenNeto,
        comparativaAnterior.margenNeto
      );

      return {
        resumenPeriodo: {
          ingresosTotales: rentabilidad.ingresosBrutos,
          costosTotales: costos.total,
          margenBruto: rentabilidad.margenBruto,
          superficieGestionada: superficieTotal,
          actividadesRealizadas: actividadesTotal,
          cambioRespectoPeriodoAnterior,
        },
        indicadoresClave: {
          costoPorHectarea: costos.promedioPorHectarea,
          rendimientoPorHectarea: rendimiento.rendimientoPorHectarea,
          margenPorHectarea: rentabilidad.roiPorHectarea,
          eficienciaOperativa: rendimiento.eficienciaOperativa,
          indiceRentabilidad: rentabilidad.roi,
        },
        distribucionCostos: [
          { categoria: 'Productos', porcentaje: (costos.productos / costos.total) * 100, valor: costos.productos },
          { categoria: 'Mano de Obra', porcentaje: (costos.manoObra / costos.total) * 100, valor: costos.manoObra },
          { categoria: 'Maquinaria', porcentaje: (costos.maquinaria / costos.total) * 100, valor: costos.maquinaria },
          { categoria: 'Combustible', porcentaje: (costos.combustible / costos.total) * 100, valor: costos.combustible },
          { categoria: 'Otros', porcentaje: (costos.otros / costos.total) * 100, valor: costos.otros },
        ],
        tendencias: comparativaTemporal,
        alertas: alertas.slice(0, 5), // Top 5 alertas más importantes
      };

    } catch (error) {
      logger.error('Error generating dashboard:', error);
      throw new Error('Error generando dashboard de métricas');
    }
  }

  // Métodos privados de utilidad

  private async getActivitiesData(filters: AnalyticsFilters, tiposActividad?: string[]) {
    const whereClause: any = {
      userId: filters.userId,
    };

    if (filters.parcelaIds?.length) {
      whereClause.parcelaId = { in: filters.parcelaIds };
    }

    if (filters.fechaInicio || filters.fechaFin) {
      whereClause.fechaInicio = {};
      if (filters.fechaInicio) {
        whereClause.fechaInicio.gte = filters.fechaInicio;
      }
      if (filters.fechaFin) {
        whereClause.fechaInicio.lte = filters.fechaFin;
      }
    }

    if (tiposActividad?.length || filters.tipoActividad?.length) {
      const tipos = tiposActividad || filters.tipoActividad || [];
      whereClause.tipo = { in: tipos };
    }

    return await this.prisma.actividad.findMany({
      where: whereClause,
      include: {
        parcela: true,
      },
    });
  }

  private async calculatePreviousPeriodCosts(filters: AnalyticsFilters) {
    // Implementación simplificada - en realidad calcularía el período anterior
    return { total: 800, productos: 400, manoObra: 200, maquinaria: 150, combustible: 50, otros: 0 };
  }

  private async calculatePreviousPeriodRendimiento(filters: AnalyticsFilters) {
    return { rendimientoPorHectarea: 3800, eficienciaOperativa: 85 };
  }

  private async calculatePreviousPeriodRentabilidad(filters: AnalyticsFilters) {
    return { roi: 10, margenNeto: 600 };
  }

  private calculateTrend(current: number, previous: number): 'aumentando' | 'disminuyendo' | 'estable' {
    const change = (current - previous) / previous;
    if (change > 0.05) return 'aumentando';
    if (change < -0.05) return 'disminuyendo';
    return 'estable';
  }

  private calculateTrendRendimiento(current: number, previous: number): 'mejorando' | 'empeorando' | 'estable' {
    const change = (current - previous) / previous;
    if (change > 0.05) return 'mejorando';
    if (change < -0.05) return 'empeorando';
    return 'estable';
  }

  private calculateTrendRentabilidad(current: number, previous: number): 'positiva' | 'negativa' | 'estable' {
    const change = current - previous;
    if (change > 2) return 'positiva';
    if (change < -2) return 'negativa';
    return 'estable';
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  private convertirCalidadANumero(calidad: string): number {
    const calidades: { [key: string]: number } = {
      'excelente': 5,
      'muy buena': 4.5,
      'buena': 4,
      'regular': 3,
      'mala': 2,
      'muy mala': 1,
    };
    return calidades[calidad.toLowerCase()] || 3;
  }

  private async getRendimientoPromediSector(filters: AnalyticsFilters): Promise<number> {
    // En una implementación real, esto vendría de una base de datos de benchmarks del sector
    return 4200; // kg/ha promedio del sector
  }

  private async getPreciosPromedioMercado(filters: AnalyticsFilters): Promise<number> {
    // En una implementación real, esto se obtendría de APIs de precios de mercado
    return 0.35; // €/kg promedio
  }

  private async getSuperficieTotal(filters: AnalyticsFilters): Promise<number> {
    const whereClause: any = { userId: filters.userId };
    
    if (filters.parcelaIds?.length) {
      whereClause.id = { in: filters.parcelaIds };
    }

    const parcelas = await this.prisma.parcela.findMany({
      where: whereClause,
      select: { superficie: true },
    });

    return parcelas.reduce((total, parcela) => total + parcela.superficie, 0);
  }

  private async getActividadesCount(filters: AnalyticsFilters): Promise<number> {
    const actividades = await this.getActivitiesData(filters);
    return actividades.length;
  }

  private calculateAnualProjection(margenNeto: number, filters: AnalyticsFilters): number {
    // Proyección simple basada en el margen actual
    const mesesEnPeriodo = this.calculateMonthsInPeriod(filters);
    return mesesEnPeriodo > 0 ? (margenNeto / mesesEnPeriodo) * 12 : 0;
  }

  private calculateMonthsInPeriod(filters: AnalyticsFilters): number {
    if (!filters.fechaInicio || !filters.fechaFin) return 12;
    
    const diffTime = filters.fechaFin.getTime() - filters.fechaInicio.getTime();
    return diffTime / (1000 * 60 * 60 * 24 * 30.44); // Días promedio en un mes
  }

  private async getPreviousPeriodSummary(filters: AnalyticsFilters) {
    return { margenNeto: 500 }; // Implementación simplificada
  }

  private calculatePercentile(valor: number, promedio: number, mejor: number, peor: number): number {
    if (valor >= mejor) return 90;
    if (valor <= peor) return 10;
    
    const rango = mejor - peor;
    const posicion = valor - peor;
    return Math.round((posicion / rango) * 80) + 10; // Entre 10 y 90
  }

  private getRecommendationCostos(valor: number, promedio: number): string {
    if (valor > promedio * 1.2) return 'Costos significativamente altos. Revisar proveedores y optimizar uso de insumos.';
    if (valor > promedio) return 'Costos ligeramente por encima del promedio. Buscar oportunidades de optimización.';
    return 'Costos controlados. Mantener eficiencia actual.';
  }

  private getRecommendationRendimiento(valor: number, promedio: number): string {
    if (valor < promedio * 0.8) return 'Rendimiento muy bajo. Revisar técnicas de cultivo y variedades utilizadas.';
    if (valor < promedio) return 'Rendimiento por debajo del promedio. Considerar mejoras en manejo del cultivo.';
    return 'Excelente rendimiento. Mantener prácticas actuales.';
  }

  private getRecommendationROI(valor: number, promedio: number): string {
    if (valor < 0) return 'ROI negativo. Revisión urgente de estrategia comercial y de costos.';
    if (valor < promedio) return 'ROI por debajo del promedio. Optimizar rentabilidad.';
    return 'Excelente ROI. Considerar expansión de operaciones.';
  }

  private getRecommendationMargen(valor: number, promedio: number): string {
    if (valor < promedio * 0.5) return 'Margen muy bajo. Revisar estructura de costos y precios de venta.';
    if (valor < promedio) return 'Margen por debajo del promedio. Buscar oportunidades de mejora.';
    return 'Margen saludable. Mantener eficiencia operativa.';
  }

  private async calculateImpactoBajoRendimiento(rendimiento: RendimientoAnalysis, filters: AnalyticsFilters): Promise<number> {
    const superficie = await this.getSuperficieTotal(filters);
    const rendimientoPerdido = rendimiento.rendimientoPromedio - rendimiento.rendimientoPorHectarea;
    const precio = await this.getPreciosPromedioMercado(filters);
    return rendimientoPerdido * superficie * precio;
  }

  private calculateImpactoTendencia(costos: CostosAnalysis, rentabilidad: RentabilidadAnalysis): number {
    return Math.abs(rentabilidad.margenNeto * 0.1); // 10% del margen como impacto estimado
  }

  private calculateImpactoPositivo(rendimiento: RendimientoAnalysis, rentabilidad: RentabilidadAnalysis): number {
    return rentabilidad.margenNeto * 0.2; // 20% adicional por encima del promedio
  }
}

export default AnalyticsService;