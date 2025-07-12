// profitabilityEngine.ts - Motor de cálculo de rentabilidad agrícola
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

export interface CostStructure {
  variable: {
    semillas: number;
    fertilizantes: number;
    fitosanitarios: number;
    agua: number;
    combustible: number;
    manoObraVariable: number;
    otros: number;
  };
  fijo: {
    maquinaria: number;
    manoObraFija: number;
    seguros: number;
    impuestos: number;
    arrendamiento: number;
    depreciacion: number;
    otros: number;
  };
}

export interface RevenueProjection {
  produccionEstimada: number; // kg
  precioVentaPromedio: number; // €/kg
  ingresosBrutos: number;
  subvencionesPAC: number;
  otrosIngresos: number;
  ingresosTotales: number;
}

export interface ProfitabilityMetrics {
  margenBruto: number; // Ingresos - Costos Variables
  margenNeto: number;  // Ingresos - Costos Totales
  margenContribucion: number; // % del margen bruto sobre ingresos
  puntoEquilibrio: {
    unidades: number; // kg necesarios para cubrir costos
    precio: number;   // precio mínimo por kg
  };
  roi: number; // Return on Investment
  paybackPeriod: number; // Años para recuperar inversión
  npv: number; // Valor Presente Neto
  irr: number; // Tasa Interna de Retorno
}

export interface RiskAssessment {
  riesgoPrice: {
    volatilidad: number;
    precioMinimo: number;
    precioMaximo: number;
    probabilidadPerdida: number;
  };
  riesgoProduccion: {
    rendimientoMinimo: number;
    rendimientoMaximo: number;
    factoresRiesgo: string[];
    probabilidadBajoRendimiento: number;
  };
  riesgoClima: {
    probabilidadHelada: number;
    probabilidadSequia: number;
    probabilidadGranizo: number;
    impactoPromedio: number;
  };
  riesgoMercado: {
    demandaEstabilidad: number;
    competenciaIntensidad: number;
    barreras: string[];
  };
}

export interface ProfitabilityScenario {
  nombre: string;
  tipo: 'optimista' | 'pesimista' | 'conservador';
  probabilidad: number;
  costos: CostStructure;
  ingresos: RevenueProjection;
  metricas: ProfitabilityMetrics;
  descripcion: string;
}

export interface OptimizationRecommendation {
  categoria: 'costos' | 'ingresos' | 'operacional' | 'financiero';
  titulo: string;
  descripcion: string;
  impactoEconomico: number;
  dificultadImplementacion: 'baja' | 'media' | 'alta';
  tiempoImplementacion: string;
  riesgoAsociado: 'bajo' | 'medio' | 'alto';
  prioridad: number;
  pasos: string[];
}

class ProfitabilityEngine {
  constructor(private prisma: PrismaClient) {}

  /**
   * Calcula la estructura completa de costos para una parcela
   */
  async calculateCostStructure(
    parcelaId: string, 
    fechaInicio: Date, 
    fechaFin: Date
  ): Promise<CostStructure> {
    try {
      const actividades = await this.prisma.actividad.findMany({
        where: {
          parcelaId,
          fechaInicio: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
        include: {
          parcela: true,
        },
      });

      const costoVariable = {
        semillas: 0,
        fertilizantes: 0,
        fitosanitarios: 0,
        agua: 0,
        combustible: 0,
        manoObraVariable: 0,
        otros: 0,
      };

      const costoFijo = {
        maquinaria: 0,
        manoObraFija: 0,
        seguros: 0,
        impuestos: 0,
        arrendamiento: 0,
        depreciacion: 0,
        otros: 0,
      };

      // Procesar cada actividad y categorizar costos
      for (const actividad of actividades) {
        const costos = actividad.costos as any;
        if (!costos) continue;

        // Categorizar productos por tipo
        const productos = actividad.productos as any[];
        if (productos) {
          for (const producto of productos) {
            const costo = (producto.dosis * producto.precio_unidad) || 0;
            
            switch (producto.tipo) {
              case 'semilla':
                costoVariable.semillas += costo;
                break;
              case 'fertilizante':
                costoVariable.fertilizantes += costo;
                break;
              case 'herbicida':
              case 'fungicida':
              case 'insecticida':
                costoVariable.fitosanitarios += costo;
                break;
              default:
                costoVariable.otros += costo;
            }
          }
        }

        // Otros costos directos
        costoVariable.combustible += costos.combustible || 0;
        costoVariable.manoObraVariable += costos.mano_obra || 0;
        costoFijo.maquinaria += costos.maquinaria || 0;
      }

      // Calcular costos fijos estimados (basados en superficie de la parcela)
      const parcela = actividades[0]?.parcela;
      if (parcela) {
        const superficie = parcela.superficie;
        
        // Estimaciones de costos fijos por hectárea
        costoFijo.seguros += superficie * 50; // €50/ha/año
        costoFijo.impuestos += superficie * 30; // €30/ha/año
        costoFijo.depreciacion += superficie * 100; // €100/ha/año
        
        // Arrendamiento si aplica (basado en metadatos de la parcela)
        const metadatos = parcela.metadatos as any;
        if (metadatos?.regimen_tenencia === 'arrendamiento') {
          costoFijo.arrendamiento += superficie * 200; // €200/ha/año
        }
      }

      return {
        variable: costoVariable,
        fijo: costoFijo,
      };

    } catch (error) {
      logger.error('Error calculating cost structure:', error);
      throw new Error('Error calculando estructura de costos');
    }
  }

  /**
   * Proyecta ingresos esperados
   */
  async projectRevenue(
    parcelaId: string,
    fechaInicio: Date,
    fechaFin: Date,
    cultivoTipo?: string
  ): Promise<RevenueProjection> {
    try {
      const parcela = await this.prisma.parcela.findUnique({
        where: { id: parcelaId },
        include: {
          actividades: {
            where: {
              tipo: 'cosecha',
              fechaInicio: {
                gte: fechaInicio,
                lte: fechaFin,
              },
            },
          },
        },
      });

      if (!parcela) {
        throw new Error('Parcela no encontrada');
      }

      // Obtener producción real o estimada
      let produccionEstimada = 0;
      const actividadesCosecha = parcela.actividades;
      
      if (actividadesCosecha.length > 0) {
        // Si hay cosechas registradas, usar datos reales
        for (const cosecha of actividadesCosecha) {
          const resultados = cosecha.resultados as any;
          if (resultados?.rendimiento) {
            produccionEstimada += resultados.rendimiento;
          }
        }
      } else {
        // Si no hay datos, estimar basado en superficie y rendimiento promedio
        const cultivo = parcela.cultivo as any;
        const rendimientoPromedio = this.getRendimientoPromedioPorCultivo(
          cultivoTipo || cultivo?.tipo || 'cereal'
        );
        produccionEstimada = parcela.superficie * rendimientoPromedio;
      }

      // Obtener precio de mercado actual
      const precioVentaPromedio = await this.getPrecioMercadoActual(
        cultivoTipo || (parcela.cultivo as any)?.tipo || 'cereal'
      );

      const ingresosBrutos = produccionEstimada * precioVentaPromedio;
      
      // Calcular subvenciones PAC estimadas
      const subvencionesPAC = await this.calculateSubvencionesPAC(parcela);
      
      // Otros ingresos (seguros, contratos, etc.)
      const otrosIngresos = 0; // Implementar según necesidades específicas

      const ingresosTotales = ingresosBrutos + subvencionesPAC + otrosIngresos;

      return {
        produccionEstimada,
        precioVentaPromedio,
        ingresosBrutos,
        subvencionesPAC,
        otrosIngresos,
        ingresosTotales,
      };

    } catch (error) {
      logger.error('Error projecting revenue:', error);
      throw new Error('Error proyectando ingresos');
    }
  }

  /**
   * Calcula métricas completas de rentabilidad
   */
  async calculateProfitabilityMetrics(
    costos: CostStructure,
    ingresos: RevenueProjection,
    inversionInicial: number = 0,
    horizonteTemporal: number = 5
  ): Promise<ProfitabilityMetrics> {
    try {
      // Calcular costos totales
      const costosVariablesTotales = Object.values(costos.variable).reduce((a, b) => a + b, 0);
      const costosFijosTotales = Object.values(costos.fijo).reduce((a, b) => a + b, 0);
      const costosTotales = costosVariablesTotales + costosFijosTotales;

      // Calcular márgenes
      const margenBruto = ingresos.ingresosTotales - costosVariablesTotales;
      const margenNeto = ingresos.ingresosTotales - costosTotales;
      const margenContribucion = ingresos.ingresosTotales > 0 ? 
        (margenBruto / ingresos.ingresosTotales) * 100 : 0;

      // Punto de equilibrio
      const puntoEquilibrio = {
        unidades: ingresos.precioVentaPromedio > 0 ? 
          costosTotales / ingresos.precioVentaPromedio : 0,
        precio: ingresos.produccionEstimada > 0 ? 
          costosTotales / ingresos.produccionEstimada : 0,
      };

      // ROI
      const inversionTotal = inversionInicial + costosTotales;
      const roi = inversionTotal > 0 ? (margenNeto / inversionTotal) * 100 : 0;

      // Período de retorno
      const paybackPeriod = margenNeto > 0 ? inversionInicial / margenNeto : Infinity;

      // NPV e IRR (cálculos simplificados para múltiples períodos)
      const npv = this.calculateNPV(margenNeto, inversionInicial, horizonteTemporal, 0.08);
      const irr = this.calculateIRR([inversionInicial * -1, ...Array(horizonteTemporal).fill(margenNeto)]);

      return {
        margenBruto: Math.round(margenBruto * 100) / 100,
        margenNeto: Math.round(margenNeto * 100) / 100,
        margenContribucion: Math.round(margenContribucion * 100) / 100,
        puntoEquilibrio: {
          unidades: Math.round(puntoEquilibrio.unidades * 100) / 100,
          precio: Math.round(puntoEquilibrio.precio * 100) / 100,
        },
        roi: Math.round(roi * 100) / 100,
        paybackPeriod: Math.round(paybackPeriod * 100) / 100,
        npv: Math.round(npv * 100) / 100,
        irr: Math.round(irr * 100) / 100,
      };

    } catch (error) {
      logger.error('Error calculating profitability metrics:', error);
      throw new Error('Error calculando métricas de rentabilidad');
    }
  }

  /**
   * Evalúa riesgos asociados a la operación
   */
  async assessRisk(
    parcelaId: string,
    cultivoTipo: string,
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<RiskAssessment> {
    try {
      const parcela = await this.prisma.parcela.findUnique({
        where: { id: parcelaId },
      });

      if (!parcela) {
        throw new Error('Parcela no encontrada');
      }

      // Análisis de riesgo de precios
      const historicoPrecio = await this.getHistoricoPreciosCultivo(cultivoTipo, 24); // 24 meses
      const precioActual = await this.getPrecioMercadoActual(cultivoTipo);
      const volatilidad = this.calculateVolatilidad(historicoPrecio);
      
      const riesgoPrice = {
        volatilidad: Math.round(volatilidad * 100) / 100,
        precioMinimo: Math.min(...historicoPrecio),
        precioMaximo: Math.max(...historicoPrecio),
        probabilidadPerdida: this.calculateProbabilidadPerdidaPrecio(historicoPrecio, precioActual),
      };

      // Análisis de riesgo de producción
      const historicoRendimiento = await this.getHistoricoRendimiento(cultivoTipo, parcela.provincia);
      const rendimientoPromedio = historicoRendimiento.reduce((a, b) => a + b, 0) / historicoRendimiento.length;
      
      const riesgoProduccion = {
        rendimientoMinimo: Math.min(...historicoRendimiento),
        rendimientoMaximo: Math.max(...historicoRendimiento),
        factoresRiesgo: this.getFactoresRiesgoCultivo(cultivoTipo),
        probabilidadBajoRendimiento: this.calculateProbabilidadBajoRendimiento(historicoRendimiento),
      };

      // Análisis de riesgo climático
      const riesgoClima = await this.assessClimaticRisk(parcela.latitud, parcela.longitud, cultivoTipo);

      // Análisis de riesgo de mercado
      const riesgoMercado = await this.assessMarketRisk(cultivoTipo);

      return {
        riesgoPrice,
        riesgoProduccion,
        riesgoClima,
        riesgoMercado,
      };

    } catch (error) {
      logger.error('Error assessing risk:', error);
      throw new Error('Error evaluando riesgos');
    }
  }

  /**
   * Genera escenarios de rentabilidad
   */
  async generateScenarios(
    parcelaId: string,
    fechaInicio: Date,
    fechaFin: Date,
    cultivoTipo?: string
  ): Promise<ProfitabilityScenario[]> {
    try {
      const [costosBase, ingresosBase, riesgo] = await Promise.all([
        this.calculateCostStructure(parcelaId, fechaInicio, fechaFin),
        this.projectRevenue(parcelaId, fechaInicio, fechaFin, cultivoTipo),
        this.assessRisk(parcelaId, cultivoTipo || 'cereal', fechaInicio, fechaFin),
      ]);

      const escenarios: ProfitabilityScenario[] = [];

      // Escenario Optimista
      const costosOptimista = this.adjustCosts(costosBase, -0.1); // 10% menos costos
      const ingresosOptimista = this.adjustRevenue(ingresosBase, 0.2); // 20% más ingresos
      const metricasOptimista = await this.calculateProfitabilityMetrics(costosOptimista, ingresosOptimista);
      
      escenarios.push({
        nombre: 'Optimista',
        tipo: 'optimista',
        probabilidad: 20,
        costos: costosOptimista,
        ingresos: ingresosOptimista,
        metricas: metricasOptimista,
        descripcion: 'Condiciones favorables: buenos precios, excelente rendimiento, costos controlados.',
      });

      // Escenario Conservador (base)
      const metricasConservador = await this.calculateProfitabilityMetrics(costosBase, ingresosBase);
      
      escenarios.push({
        nombre: 'Conservador',
        tipo: 'conservador',
        probabilidad: 60,
        costos: costosBase,
        ingresos: ingresosBase,
        metricas: metricasConservador,
        descripción: 'Condiciones normales basadas en datos históricos y tendencias actuales.',
      });

      // Escenario Pesimista
      const costosPesimista = this.adjustCosts(costosBase, 0.15); // 15% más costos
      const ingresosPesimista = this.adjustRevenue(ingresosBase, -0.25); // 25% menos ingresos
      const metricasPesimista = await this.calculateProfitabilityMetrics(costosPesimista, ingresosPesimista);
      
      escenarios.push({
        nombre: 'Pesimista',
        tipo: 'pesimista',
        probabilidad: 20,
        costos: costosPesimista,
        ingresos: ingresosPesimista,
        metricas: metricasPesimista,
        descripcion: 'Condiciones adversas: precios bajos, bajo rendimiento, costos elevados.',
      });

      return escenarios;

    } catch (error) {
      logger.error('Error generating scenarios:', error);
      throw new Error('Error generando escenarios de rentabilidad');
    }
  }

  /**
   * Genera recomendaciones de optimización
   */
  async generateOptimizationRecommendations(
    parcelaId: string,
    costos: CostStructure,
    ingresos: RevenueProjection,
    metricas: ProfitabilityMetrics,
    riesgo: RiskAssessment
  ): Promise<OptimizationRecommendation[]> {
    try {
      const recomendaciones: OptimizationRecommendation[] = [];
      const costosTotales = this.getTotalCosts(costos);

      // Recomendaciones de costos
      if (costos.variable.fitosanitarios / costosTotales > 0.3) {
        recomendaciones.push({
          categoria: 'costos',
          titulo: 'Optimizar Uso de Fitosanitarios',
          descripcion: 'Los costos de fitosanitarios representan más del 30% del total. Considerar manejo integrado de plagas.',
          impactoEconomico: costos.variable.fitosanitarios * 0.2,
          dificultadImplementacion: 'media',
          tiempoImplementacion: '1-2 temporadas',
          riesgoAsociado: 'medio',
          prioridad: 8,
          pasos: [
            'Realizar monitoreo de plagas más frecuente',
            'Implementar umbrales económicos de daño',
            'Considerar productos biológicos alternativos',
            'Evaluar rotación de principios activos',
          ],
        });
      }

      if (costos.variable.fertilizantes / costosTotales > 0.25) {
        recomendaciones.push({
          categoria: 'costos',
          titulo: 'Optimizar Plan de Fertilización',
          descripcion: 'Los costos de fertilización son elevados. Un análisis de suelo podría optimizar las aplicaciones.',
          impactoEconomico: costos.variable.fertilizantes * 0.15,
          dificultadImplementacion: 'baja',
          tiempoImplementacion: '1 temporada',
          riesgoAsociado: 'bajo',
          prioridad: 7,
          pasos: [
            'Realizar análisis de suelo detallado',
            'Ajustar dosis según necesidades específicas',
            'Considerar fertilización foliar complementaria',
            'Evaluar fertilizantes de liberación lenta',
          ],
        });
      }

      // Recomendaciones de ingresos
      if (metricas.margenNeto < 100) {
        recomendaciones.push({
          categoria: 'ingresos',
          titulo: 'Mejorar Estrategia Comercial',
          descripcion: 'El margen neto es muy bajo. Explorar canales de venta alternativos y contratos a futuro.',
          impactoEconomico: ingresos.ingresosBrutos * 0.1,
          dificultadImplementacion: 'media',
          tiempoImplementacion: '6-12 meses',
          riesgoAsociado: 'medio',
          prioridad: 9,
          pasos: [
            'Analizar mercados locales y regionales',
            'Explorar venta directa al consumidor',
            'Negociar contratos con cooperativas',
            'Considerar certificaciones de calidad',
          ],
        });
      }

      // Recomendaciones operacionales
      if (riesgo.riesgoProduccion.probabilidadBajoRendimiento > 0.3) {
        recomendaciones.push({
          categoria: 'operacional',
          titulo: 'Mejorar Técnicas de Cultivo',
          descripcion: 'Alta probabilidad de bajo rendimiento. Revisar prácticas agronómicas.',
          impactoEconomico: ingresos.produccionEstimada * ingresos.precioVentaPromedio * 0.15,
          dificultadImplementacion: 'media',
          tiempoImplementacion: '1-2 temporadas',
          riesgoAsociado: 'bajo',
          prioridad: 6,
          pasos: [
            'Revisar variedades cultivadas',
            'Optimizar fechas de siembra',
            'Mejorar manejo del riego',
            'Implementar rotación de cultivos',
          ],
        });
      }

      // Recomendaciones financieras
      if (metricas.roi < 10) {
        recomendaciones.push({
          categoria: 'financiero',
          titulo: 'Revisar Estructura Financiera',
          descripcion: 'ROI por debajo del 10%. Considerar refinanciación o diversificación.',
          impactoEconomico: metricas.margenNeto * 0.3,
          dificultadImplementacion: 'alta',
          tiempoImplementacion: '1-3 años',
          riesgoAsociado: 'medio',
          prioridad: 5,
          pasos: [
            'Analizar opciones de financiación',
            'Evaluar diversificación de cultivos',
            'Considerar agricultura de contrato',
            'Explorar seguros agrícolas',
          ],
        });
      }

      // Ordenar por prioridad
      return recomendaciones.sort((a, b) => b.prioridad - a.prioridad);

    } catch (error) {
      logger.error('Error generating optimization recommendations:', error);
      throw new Error('Error generando recomendaciones de optimización');
    }
  }

  // Métodos privados de utilidad

  private getRendimientoPromedioPorCultivo(tipo: string): number {
    const rendimientos: { [key: string]: number } = {
      'cereal': 4200,    // kg/ha
      'trigo': 4000,
      'cebada': 3800,
      'maiz': 8000,
      'girasol': 2200,
      'soja': 2800,
      'olivar': 1500,
      'viñedo': 8000,
      'almendro': 1200,
      'tomate': 25000,
      'pimiento': 15000,
    };
    
    return rendimientos[tipo.toLowerCase()] || 3000;
  }

  private async getPrecioMercadoActual(cultivo: string): Promise<number> {
    // En una implementación real, esto se obtendría de APIs de precios
    const precios: { [key: string]: number } = {
      'cereal': 0.25,
      'trigo': 0.24,
      'cebada': 0.22,
      'maiz': 0.26,
      'girasol': 0.45,
      'soja': 0.48,
      'olivar': 3.50,
      'viñedo': 0.80,
      'almendro': 6.00,
      'tomate': 0.65,
      'pimiento': 1.20,
    };
    
    return precios[cultivo.toLowerCase()] || 0.30;
  }

  private async calculateSubvencionesPAC(parcela: any): Promise<number> {
    // Estimación de subvenciones PAC por hectárea
    const subvencionBasica = 180; // €/ha pago básico
    const subvencionVerde = 50;   // €/ha greening
    const subvencionJoven = parcela.userId ? 50 : 0; // €/ha para jóvenes agricultores
    
    return parcela.superficie * (subvencionBasica + subvencionVerde + subvencionJoven);
  }

  private calculateNPV(flujoEfectivo: number, inversion: number, años: number, tasa: number): number {
    let npv = -inversion;
    for (let i = 1; i <= años; i++) {
      npv += flujoEfectivo / Math.pow(1 + tasa, i);
    }
    return npv;
  }

  private calculateIRR(flujos: number[]): number {
    // Implementación simplificada del IRR usando método de Newton-Raphson
    let irr = 0.1; // Estimación inicial 10%
    
    for (let i = 0; i < 100; i++) {
      let npv = 0;
      let dnpv = 0;
      
      for (let j = 0; j < flujos.length; j++) {
        npv += flujos[j] / Math.pow(1 + irr, j);
        if (j > 0) {
          dnpv -= j * flujos[j] / Math.pow(1 + irr, j + 1);
        }
      }
      
      if (Math.abs(npv) < 0.001) break;
      irr = irr - npv / dnpv;
    }
    
    return irr * 100;
  }

  private calculateVolatilidad(precios: number[]): number {
    if (precios.length < 2) return 0;
    
    const media = precios.reduce((a, b) => a + b, 0) / precios.length;
    const varianza = precios.reduce((sum, precio) => sum + Math.pow(precio - media, 2), 0) / precios.length;
    
    return Math.sqrt(varianza) / media; // Coeficiente de variación
  }

  private calculateProbabilidadPerdidaPrecio(historico: number[], actual: number): number {
    const preciosBajos = historico.filter(p => p < actual * 0.8).length;
    return preciosBajos / historico.length;
  }

  private async getHistoricoPreciosCultivo(cultivo: string, meses: number): Promise<number[]> {
    // Simulación de datos históricos
    const precioBase = await this.getPrecioMercadoActual(cultivo);
    const precios: number[] = [];
    
    for (let i = 0; i < meses; i++) {
      const variacion = (Math.random() - 0.5) * 0.4; // ±20% variación
      precios.push(precioBase * (1 + variacion));
    }
    
    return precios;
  }

  private async getHistoricoRendimiento(cultivo: string, provincia: string): Promise<number[]> {
    // Simulación de datos históricos de rendimiento
    const rendimientoBase = this.getRendimientoPromedioPorCultivo(cultivo);
    const rendimientos: number[] = [];
    
    for (let i = 0; i < 10; i++) {
      const variacion = (Math.random() - 0.5) * 0.6; // ±30% variación
      rendimientos.push(rendimientoBase * (1 + variacion));
    }
    
    return rendimientos;
  }

  private getFactoresRiesgoCultivo(cultivo: string): string[] {
    const factores: { [key: string]: string[] } = {
      'cereal': ['sequía', 'heladas tardías', 'enfermedades fúngicas', 'plagas'],
      'olivar': ['mosca del olivo', 'repilo', 'sequía', 'heladas'],
      'viñedo': ['mildiu', 'oidio', 'granizo', 'heladas primavera'],
      'tomate': ['virus', 'hongos del suelo', 'plagas', 'estrés hídrico'],
    };
    
    return factores[cultivo.toLowerCase()] || ['condiciones climáticas', 'plagas', 'enfermedades'];
  }

  private calculateProbabilidadBajoRendimiento(historico: number[]): number {
    const media = historico.reduce((a, b) => a + b, 0) / historico.length;
    const rendimientosBajos = historico.filter(r => r < media * 0.8).length;
    return rendimientosBajos / historico.length;
  }

  private async assessClimaticRisk(lat: number, lng: number, cultivo: string): Promise<any> {
    // Evaluación simplificada basada en ubicación
    return {
      probabilidadHelada: lat > 40 ? 0.3 : 0.1,
      probabilidadSequia: lng < -2 ? 0.4 : 0.2,
      probabilidadGranizo: 0.15,
      impactoPromedio: 0.25,
    };
  }

  private async assessMarketRisk(cultivo: string): Promise<any> {
    // Evaluación simplificada de riesgo de mercado
    return {
      demandaEstabilidad: 0.8,
      competenciaIntensidad: 0.6,
      barreras: ['regulaciones', 'certificaciones', 'logística'],
    };
  }

  private adjustCosts(costos: CostStructure, factor: number): CostStructure {
    const adjustValue = (value: number) => Math.max(0, value * (1 + factor));
    
    return {
      variable: Object.fromEntries(
        Object.entries(costos.variable).map(([key, value]) => [key, adjustValue(value)])
      ) as any,
      fijo: Object.fromEntries(
        Object.entries(costos.fijo).map(([key, value]) => [key, adjustValue(value)])
      ) as any,
    };
  }

  private adjustRevenue(ingresos: RevenueProjection, factor: number): RevenueProjection {
    return {
      ...ingresos,
      produccionEstimada: Math.max(0, ingresos.produccionEstimada * (1 + factor)),
      precioVentaPromedio: Math.max(0, ingresos.precioVentaPromedio * (1 + factor * 0.5)),
      ingresosBrutos: Math.max(0, ingresos.ingresosBrutos * (1 + factor)),
      ingresosTotales: Math.max(0, ingresos.ingresosTotales * (1 + factor)),
    };
  }

  private getTotalCosts(costos: CostStructure): number {
    const variable = Object.values(costos.variable).reduce((a, b) => a + b, 0);
    const fijo = Object.values(costos.fijo).reduce((a, b) => a + b, 0);
    return variable + fijo;
  }
}

export default ProfitabilityEngine;