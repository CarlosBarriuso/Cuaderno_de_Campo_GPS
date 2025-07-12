// alertsProcessor.ts - Procesador de alertas agrícolas
import { 
  AgriculturalAlert, 
  WeatherData, 
  WeatherForecast 
} from './types';

export class AlertsProcessor {
  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
  }

  /**
   * Procesa datos meteorológicos y genera alertas agrícolas
   */
  processWeatherAlerts(
    currentWeather: WeatherData, 
    forecast: WeatherForecast[], 
    location: { lat: number; lng: number; municipio?: string; provincia?: string }
  ): AgriculturalAlert[] {
    const alerts: AgriculturalAlert[] = [];

    // Analizar condiciones actuales
    alerts.push(...this.checkCurrentConditions(currentWeather, location));
    
    // Analizar predicciones
    alerts.push(...this.checkForecastConditions(forecast, location));

    return alerts.filter(alert => alert !== null);
  }

  /**
   * Analiza condiciones meteorológicas actuales
   */
  private checkCurrentConditions(weather: WeatherData, location: any): AgriculturalAlert[] {
    const alerts: AgriculturalAlert[] = [];
    const now = new Date();

    // Alerta de helada
    if (weather.temperatura <= 2) {
      alerts.push({
        id: `helada-${now.getTime()}`,
        tipo: 'helada',
        severidad: weather.temperatura <= -2 ? 'alta' : 'media',
        titulo: 'Riesgo de Helada',
        descripcion: `Temperatura actual ${weather.temperatura}°C. Riesgo de helada para cultivos sensibles.`,
        inicio: now,
        fin: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 horas
        area_afectada: {
          centro: { lat: location.lat, lng: location.lng },
          radio: 10,
          provincias: location.provincia ? [location.provincia] : undefined,
          municipios: location.municipio ? [location.municipio] : undefined
        },
        cultivos_afectados: ['tomate', 'pimiento', 'berenjena', 'calabacín', 'melón', 'sandía'],
        actividades_riesgo: ['siembra', 'transplante', 'floración'],
        recomendaciones: [
          'Proteger cultivos sensibles con mantas térmicas',
          'Evitar riegos nocturnos',
          'Considerar sistemas de calefacción en invernaderos',
          'Postponer siembras hasta que pase el riesgo'
        ],
        fuente: weather.fuente,
        confianza: 0.9,
        actualizado: now
      });
    }

    // Alerta de viento fuerte
    if (weather.viento.velocidad > 50) {
      alerts.push({
        id: `viento-${now.getTime()}`,
        tipo: 'viento_fuerte',
        severidad: weather.viento.velocidad > 80 ? 'extrema' : 'alta',
        titulo: 'Viento Fuerte',
        descripcion: `Viento de ${weather.viento.velocidad} km/h. Riesgo para estructuras y cultivos.`,
        inicio: now,
        fin: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 horas
        area_afectada: {
          centro: { lat: location.lat, lng: location.lng },
          radio: 15
        },
        cultivos_afectados: ['frutales', 'viñedo', 'invernaderos', 'cultivos altos'],
        actividades_riesgo: ['pulverización', 'cosecha', 'trabajos en altura'],
        recomendaciones: [
          'Suspender trabajos con maquinaria alta',
          'Asegurar estructuras móviles (invernaderos, túneles)',
          'Postponer aplicaciones fitosanitarias',
          'Revisar sujeciones de plantas tutoreadas'
        ],
        fuente: weather.fuente,
        confianza: 0.85,
        actualizado: now
      });
    }

    // Alerta de lluvia intensa actual
    if (weather.precipitacion > 20) {
      alerts.push({
        id: `lluvia-${now.getTime()}`,
        tipo: 'lluvia_intensa',
        severidad: weather.precipitacion > 50 ? 'alta' : 'media',
        titulo: 'Lluvia Intensa',
        descripcion: `Precipitación actual: ${weather.precipitacion} mm/h. Riesgo de encharcamiento.`,
        inicio: now,
        fin: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 horas
        area_afectada: {
          centro: { lat: location.lat, lng: location.lng },
          radio: 8
        },
        cultivos_afectados: ['cereales', 'hortalizas', 'cultivos en depresiones'],
        actividades_riesgo: ['siembra', 'cosecha', 'aplicación fertilizantes'],
        recomendaciones: [
          'Revisar drenajes en parcelas',
          'Postponer siembra hasta que escampe',
          'Evitar paso de maquinaria pesada',
          'Proteger fertilizantes solubles'
        ],
        fuente: weather.fuente,
        confianza: 0.8,
        actualizado: now
      });
    }

    return alerts;
  }

  /**
   * Analiza predicciones meteorológicas
   */
  private checkForecastConditions(forecast: WeatherForecast[], location: any): AgriculturalAlert[] {
    const alerts: AgriculturalAlert[] = [];
    const now = new Date();

    forecast.forEach((day, index) => {
      const alertDate = day.fecha;
      
      // Alerta de helada nocturna
      if (day.temperatura_minima <= 3) {
        alerts.push({
          id: `helada-prevista-${alertDate.getTime()}`,
          tipo: 'helada',
          severidad: day.temperatura_minima <= 0 ? 'alta' : 'media',
          titulo: 'Helada Prevista',
          descripcion: `Temperatura mínima prevista: ${day.temperatura_minima}°C para ${alertDate.toLocaleDateString()}.`,
          inicio: new Date(alertDate.getTime() + 2 * 60 * 60 * 1000), // 2 AM
          fin: new Date(alertDate.getTime() + 8 * 60 * 60 * 1000), // 8 AM
          area_afectada: {
            centro: { lat: location.lat, lng: location.lng },
            radio: 12
          },
          cultivos_afectados: ['frutales en floración', 'viñedo', 'hortalizas tiernas'],
          actividades_riesgo: ['floración', 'brotes tiernos'],
          recomendaciones: [
            'Preparar sistemas de protección anti-helada',
            'Considerar adelantar cosecha de productos sensibles',
            'Revisar sistemas de riego anti-helada',
            'Programar tratamientos preventivos'
          ],
          fuente: 'PREDICCION',
          confianza: 0.75,
          actualizado: now
        });
      }

      // Alerta de calor extremo
      if (day.temperatura_maxima > 38) {
        alerts.push({
          id: `calor-${alertDate.getTime()}`,
          tipo: 'calor_extremo',
          severidad: day.temperatura_maxima > 42 ? 'extrema' : 'alta',
          titulo: 'Calor Extremo Previsto',
          descripcion: `Temperatura máxima prevista: ${day.temperatura_maxima}°C para ${alertDate.toLocaleDateString()}.`,
          inicio: new Date(alertDate.getTime() + 12 * 60 * 60 * 1000), // 12 PM
          fin: new Date(alertDate.getTime() + 18 * 60 * 60 * 1000), // 6 PM
          area_afectada: {
            centro: { lat: location.lat, lng: location.lng },
            radio: 20
          },
          cultivos_afectados: ['hortalizas', 'frutales', 'cereales en maduración'],
          actividades_riesgo: ['cosecha', 'trabajos al aire libre'],
          recomendaciones: [
            'Programar riegos nocturnos o muy tempranos',
            'Aumentar frecuencia de riego',
            'Proteger cultivos con sombreo',
            'Adelantar horarios de trabajo de campo',
            'Vigilar signos de estrés hídrico'
          ],
          fuente: 'PREDICCION',
          confianza: 0.8,
          actualizado: now
        });
      }

      // Alerta de lluvia fuerte prevista
      if (day.precipitacion_esperada > 30) {
        alerts.push({
          id: `lluvia-prevista-${alertDate.getTime()}`,
          tipo: 'lluvia_intensa',
          severidad: day.precipitacion_esperada > 60 ? 'alta' : 'media',
          titulo: 'Lluvia Fuerte Prevista',
          descripcion: `Precipitación esperada: ${day.precipitacion_esperada} mm para ${alertDate.toLocaleDateString()}.`,
          inicio: alertDate,
          fin: new Date(alertDate.getTime() + 24 * 60 * 60 * 1000),
          area_afectada: {
            centro: { lat: location.lat, lng: location.lng },
            radio: 15
          },
          cultivos_afectados: ['cereales maduros', 'hortalizas', 'frutales en cosecha'],
          actividades_riesgo: ['cosecha', 'aplicaciones', 'trabajo del suelo'],
          recomendaciones: [
            'Adelantar cosecha si los cultivos están maduros',
            'Postponer aplicaciones fitosanitarias',
            'Revisar drenajes y evacuación de agua',
            'Proteger maquinaria y equipos'
          ],
          fuente: 'PREDICCION',
          confianza: 0.7,
          actualizado: now
        });
      }

      // Alerta de sequía (falta de lluvia prolongada)
      if (index === 0) { // Solo verificar una vez
        const totalPrecipitacion = forecast.reduce((sum, day) => sum + day.precipitacion_esperada, 0);
        
        if (totalPrecipitacion < 5 && forecast.length >= 7) {
          alerts.push({
            id: `sequia-${now.getTime()}`,
            tipo: 'sequia',
            severidad: totalPrecipitacion < 2 ? 'alta' : 'media',
            titulo: 'Período Seco Prolongado',
            descripcion: `Solo ${totalPrecipitacion.toFixed(1)} mm de lluvia previstos en los próximos ${forecast.length} días.`,
            inicio: now,
            fin: new Date(forecast[forecast.length - 1].fecha),
            area_afectada: {
              centro: { lat: location.lat, lng: location.lng },
              radio: 25
            },
            cultivos_afectados: ['cereales', 'forrajes', 'hortalizas', 'frutales jóvenes'],
            actividades_riesgo: ['siembra sin riego', 'cultivos de secano'],
            recomendaciones: [
              'Incrementar programación de riego',
              'Considerar mulching para conservar humedad',
              'Postponer siembras de secano',
              'Monitorear niveles de agua en depósitos',
              'Implementar riego por goteo si es posible'
            ],
            fuente: 'PREDICCION',
            confianza: 0.85,
            actualizado: now
          });
        }
      }
    });

    return alerts;
  }

  /**
   * Filtra alertas por relevancia y ubicación
   */
  filterAlertsByLocation(alerts: AgriculturalAlert[], lat: number, lng: number, radius: number = 50): AgriculturalAlert[] {
    return alerts.filter(alert => {
      const distance = this.calculateDistance(
        lat, lng,
        alert.area_afectada.centro.lat,
        alert.area_afectada.centro.lng
      );
      
      return distance <= (alert.area_afectada.radio + radius);
    });
  }

  /**
   * Filtra alertas por tipo de cultivo
   */
  filterAlertsByCrop(alerts: AgriculturalAlert[], cropTypes: string[]): AgriculturalAlert[] {
    return alerts.filter(alert => {
      if (!alert.cultivos_afectados || alert.cultivos_afectados.length === 0) {
        return true; // Alertas generales se aplican a todos
      }
      
      return alert.cultivos_afectados.some(crop => 
        cropTypes.some(userCrop => 
          crop.toLowerCase().includes(userCrop.toLowerCase()) ||
          userCrop.toLowerCase().includes(crop.toLowerCase())
        )
      );
    });
  }

  /**
   * Calcula distancia entre dos puntos
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Evalúa la severidad combinada de múltiples alertas
   */
  evaluateOverallSeverity(alerts: AgriculturalAlert[]): 'baja' | 'media' | 'alta' | 'extrema' {
    if (alerts.length === 0) return 'baja';
    
    const severityScores = {
      'baja': 1,
      'media': 2,
      'alta': 3,
      'extrema': 4
    };

    const maxSeverity = Math.max(...alerts.map(alert => severityScores[alert.severidad]));
    const avgSeverity = alerts.reduce((sum, alert) => sum + severityScores[alert.severidad], 0) / alerts.length;

    if (maxSeverity >= 4 || avgSeverity >= 3.5) return 'extrema';
    if (maxSeverity >= 3 || avgSeverity >= 2.5) return 'alta';
    if (avgSeverity >= 1.5) return 'media';
    return 'baja';
  }
}