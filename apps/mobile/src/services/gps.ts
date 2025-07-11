import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  timestamp: number;
}

export interface GPSError {
  code: string;
  message: string;
}

export class GPSService {
  private static instance: GPSService;
  private hasPermission: boolean = false;

  private constructor() {}

  public static getInstance(): GPSService {
    if (!GPSService.instance) {
      GPSService.instance = new GPSService();
    }
    return GPSService.instance;
  }

  /**
   * Solicita permisos de ubicación al usuario
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.hasPermission = status === 'granted';
      
      if (!this.hasPermission) {
        Alert.alert(
          'Permisos de ubicación',
          'Esta aplicación necesita acceso a la ubicación para registrar actividades de campo con precisión GPS.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configurar', onPress: this.openSettings },
          ]
        );
      }
      
      return this.hasPermission;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Verifica si los permisos de ubicación están concedidos
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }

  /**
   * Obtiene la ubicación actual del dispositivo
   */
  async getCurrentPosition(options?: {
    accuracy?: Location.Accuracy;
    maximumAge?: number;
    timeout?: number;
  }): Promise<GPSCoordinates> {
    if (!this.hasPermission) {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('PERMISSION_DENIED');
      }
    }

    try {
      const defaultOptions = {
        accuracy: Location.Accuracy.BestForNavigation,
        maximumAge: 10000, // 10 segundos
        timeout: 15000,    // 15 segundos
        ...options,
      };

      const location = await Location.getCurrentPositionAsync(defaultOptions);

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error('Error getting current position:', error);
      
      if (error.code === 'LOCATION_UNAVAILABLE') {
        throw new Error('GPS_UNAVAILABLE');
      } else if (error.code === 'TIMEOUT') {
        throw new Error('GPS_TIMEOUT');
      } else {
        throw new Error('GPS_ERROR');
      }
    }
  }

  /**
   * Obtiene múltiples lecturas GPS para mayor precisión
   */
  async getAveragePosition(samples: number = 3, interval: number = 2000): Promise<GPSCoordinates> {
    if (samples < 1) {
      throw new Error('INVALID_SAMPLES');
    }

    const positions: GPSCoordinates[] = [];
    
    for (let i = 0; i < samples; i++) {
      try {
        const position = await this.getCurrentPosition({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        positions.push(position);
        
        // Esperar entre muestras (excepto la última)
        if (i < samples - 1) {
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      } catch (error) {
        console.warn(`Error getting GPS sample ${i + 1}:`, error);
      }
    }

    if (positions.length === 0) {
      throw new Error('NO_GPS_SAMPLES');
    }

    // Calcular promedio de las posiciones válidas
    const avgLatitude = positions.reduce((sum, pos) => sum + pos.latitude, 0) / positions.length;
    const avgLongitude = positions.reduce((sum, pos) => sum + pos.longitude, 0) / positions.length;
    
    // Usar la mejor precisión disponible
    const bestAccuracy = Math.min(...positions.filter(p => p.accuracy !== null).map(p => p.accuracy!));
    
    return {
      latitude: avgLatitude,
      longitude: avgLongitude,
      accuracy: bestAccuracy || null,
      altitude: positions[positions.length - 1].altitude, // Usar la última altitud
      timestamp: Date.now(),
    };
  }

  /**
   * Verifica si la ubicación GPS está habilitada en el dispositivo
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  /**
   * Formatea las coordenadas para mostrar
   */
  formatCoordinates(coords: GPSCoordinates): string {
    return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
  }

  /**
   * Calcula la distancia entre dos puntos GPS (en metros)
   */
  calculateDistance(point1: GPSCoordinates, point2: GPSCoordinates): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convierte grados a radianes
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Abre la configuración del dispositivo
   */
  private openSettings(): void {
    // En Expo, no hay una forma directa de abrir configuración
    // Se podría usar Linking.openSettings() en versiones futuras
    Alert.alert(
      'Configuración manual',
      'Por favor, ve a Configuración > Privacidad > Ubicación y habilita el acceso para esta aplicación.'
    );
  }

  /**
   * Valida que las coordenadas sean válidas
   */
  validateCoordinates(coords: GPSCoordinates): boolean {
    return (
      coords.latitude >= -90 && coords.latitude <= 90 &&
      coords.longitude >= -180 && coords.longitude <= 180 &&
      !isNaN(coords.latitude) && !isNaN(coords.longitude)
    );
  }

  /**
   * Obtiene información del proveedor de ubicación
   */
  async getLocationProviderStatus(): Promise<Location.LocationProviderStatus> {
    return await Location.getProviderStatusAsync();
  }
}

// Exportar instancia singleton
export const gpsService = GPSService.getInstance();