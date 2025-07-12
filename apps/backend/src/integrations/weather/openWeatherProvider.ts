// openWeatherProvider.ts - Proveedor OpenWeather como fallback
import fetch from 'node-fetch';
import { 
  WeatherData, 
  WeatherForecast, 
  OpenWeatherData,
  WeatherError 
} from './types';

export class OpenWeatherProvider {
  private readonly API_BASE = 'https://api.openweathermap.org/data/2.5';
  private readonly API_KEY: string;
  private logger: any;

  constructor(apiKey: string, logger: any) {
    this.API_KEY = apiKey;
    this.logger = logger;
  }

  /**
   * Obtiene datos meteorológicos actuales por coordenadas
   */
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData | null> {
    try {
      const url = `${this.API_BASE}/weather?lat=${lat}&lon=${lng}&appid=${this.API_KEY}&units=metric&lang=es`;
      
      const response = await fetch(url, {
        timeout: 8000
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API key de OpenWeather inválida');
        } else if (response.status === 429) {
          throw new Error('Límite de consultas OpenWeather excedido');
        }
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as OpenWeatherData;
      return this.transformOpenWeatherData(data, lat, lng);

    } catch (error) {
      this.logger.error('Error obteniendo datos OpenWeather:', error);
      throw this.createWeatherError('API_ERROR', error.message, 'OPENWEATHER');
    }
  }

  /**
   * Obtiene predicción meteorológica
   */
  async getForecast(lat: number, lng: number, days: number = 7): Promise<WeatherForecast[]> {
    try {
      const url = `${this.API_BASE}/forecast?lat=${lat}&lon=${lng}&appid=${this.API_KEY}&units=metric&lang=es&cnt=${days * 8}`; // 8 consultas por día (cada 3h)
      
      const response = await fetch(url, {
        timeout: 8000
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformForecastData(data, days);

    } catch (error) {
      this.logger.error('Error obteniendo predicción OpenWeather:', error);
      throw this.createWeatherError('API_ERROR', error.message, 'OPENWEATHER');
    }
  }

  /**
   * Transforma datos de OpenWeather al formato interno
   */
  private transformOpenWeatherData(data: OpenWeatherData, lat: number, lng: number): WeatherData {
    return {
      temperatura: Math.round(data.main.temp * 10) / 10,
      humedad: data.main.humidity,
      precipitacion: data.rain?.['1h'] || data.rain?.['3h'] || 0,
      viento: {
        velocidad: Math.round(data.wind.speed * 3.6 * 10) / 10, // m/s a km/h
        direccion: data.wind.deg,
        rafagas: data.wind.gust ? Math.round(data.wind.gust * 3.6 * 10) / 10 : undefined
      },
      presion: data.main.pressure,
      visibilidad: data.visibility ? data.visibility / 1000 : undefined, // metros a km
      punto_rocio: this.calculateDewPoint(data.main.temp, data.main.humidity),
      sensacion_termica: data.main.feels_like,
      timestamp: new Date(data.dt * 1000),
      fuente: 'OPENWEATHER',
      coordenadas: { lat, lng }
    };
  }

  /**
   * Transforma datos de predicción
   */
  private transformForecastData(forecastData: any, days: number): WeatherForecast[] {
    const forecasts: WeatherForecast[] = [];
    const list = forecastData.list || [];
    
    // Agrupar por días
    const dailyData = new Map<string, any[]>();
    
    list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, []);
      }
      dailyData.get(dateKey)!.push(item);
    });

    // Procesar cada día
    let dayCount = 0;
    for (const [dateStr, dayItems] of dailyData) {
      if (dayCount >= days) break;

      const temps = dayItems.map(item => item.main.temp);
      const precipitations = dayItems.map(item => item.rain?.['3h'] || 0);
      const winds = dayItems.map(item => item.wind.speed * 3.6); // m/s a km/h
      const humidities = dayItems.map(item => item.main.humidity);

      // Buscar descripción del mediodía (más representativa)
      const noonItem = dayItems.find(item => {
        const hour = new Date(item.dt * 1000).getHours();
        return hour >= 12 && hour <= 14;
      }) || dayItems[Math.floor(dayItems.length / 2)];

      forecasts.push({
        fecha: new Date(dateStr),
        temperatura_maxima: Math.round(Math.max(...temps) * 10) / 10,
        temperatura_minima: Math.round(Math.min(...temps) * 10) / 10,
        probabilidad_precipitacion: this.calculatePrecipitationProbability(dayItems),
        precipitacion_esperada: Math.round(precipitations.reduce((a, b) => a + b, 0) * 10) / 10,
        descripcion: noonItem.weather[0]?.description || '',
        icono: noonItem.weather[0]?.icon || '',
        viento_max: Math.round(Math.max(...winds) * 10) / 10,
        humedad_media: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
        datos_horarios: dayItems.map((item, index) => ({
          hora: new Date(item.dt * 1000).getHours(),
          temperatura: Math.round(item.main.temp * 10) / 10,
          precipitacion: item.rain?.['3h'] || 0,
          viento: Math.round(item.wind.speed * 3.6 * 10) / 10,
          humedad: item.main.humidity
        }))
      });

      dayCount++;
    }

    return forecasts;
  }

  /**
   * Calcula punto de rocío aproximado
   */
  private calculateDewPoint(temperature: number, humidity: number): number {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100);
    return Math.round(((b * alpha) / (a - alpha)) * 10) / 10;
  }

  /**
   * Calcula probabilidad de precipitación basada en los datos horarios
   */
  private calculatePrecipitationProbability(dayItems: any[]): number {
    const precipitationHours = dayItems.filter(item => 
      (item.rain?.['3h'] || 0) > 0 || (item.snow?.['3h'] || 0) > 0
    ).length;
    
    return Math.round((precipitationHours / dayItems.length) * 100);
  }

  /**
   * Crea error específico de weather
   */
  private createWeatherError(code: WeatherError['code'], message: string, provider: string): WeatherError {
    const error = new Error(message) as WeatherError;
    error.code = code;
    error.provider = provider;
    error.name = 'WeatherError';
    return error;
  }

  /**
   * Health check del proveedor
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test simple con coordenadas de Madrid
      const response = await fetch(
        `${this.API_BASE}/weather?lat=40.4168&lon=-3.7038&appid=${this.API_KEY}`,
        { timeout: 5000 }
      );
      return response.ok;
    } catch (error) {
      this.logger.error('Health check OpenWeather failed:', error);
      return false;
    }
  }

  /**
   * Obtiene información del proveedor
   */
  getProviderInfo(): any {
    return {
      name: 'OpenWeather',
      description: 'OpenWeatherMap API',
      country: 'International',
      official: false,
      type: 'fallback'
    };
  }
}