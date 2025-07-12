// Parcela.ts - Modelo WatermelonDB para parcelas
import { Model } from '@nozbe/watermelondb';
import { field, text, json, date, readonly, children, writer } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export interface ParcelaGeometria {
  type: 'Polygon' | 'Point';
  coordinates: number[][][] | number[];
}

export interface ParcelaCultivo {
  tipo: string;
  variedad?: string;
  fecha_siembra?: string;
  superficie_cultivada?: number;
  estado: 'activo' | 'barbecho' | 'cosechado';
}

export interface ParcelaMetadatos {
  sigpac_referencia?: string;
  catastro_referencia?: string;
  municipio?: string;
  provincia?: string;
  comarca?: string;
  regimen_tenencia: 'propiedad' | 'arrendamiento' | 'aparceria' | 'cesion';
  uso_principal: 'secano' | 'regadio' | 'pasto' | 'forestal' | 'otros';
}

export default class Parcela extends Model {
  static table = 'parcelas';
  
  static associations: Associations = {
    actividades: { type: 'has_many', foreignKey: 'parcela_id' },
  };

  // Campos básicos
  @text('nombre') nombre!: string;
  @text('descripcion') descripcion!: string;
  @field('superficie') superficie!: number; // hectáreas
  @text('ubicacion') ubicacion!: string;

  // Geometría GIS
  @json('geometria', (json) => json) geometria!: ParcelaGeometria;
  @field('latitud') latitud!: number;
  @field('longitud') longitud!: number;

  // Información de cultivo
  @json('cultivo', (json) => json) cultivo!: ParcelaCultivo;

  // Metadatos adicionales
  @json('metadatos', (json) => json) metadatos!: ParcelaMetadatos;

  // Estados de sincronización
  @field('sync_status') syncStatus!: 'synced' | 'pending' | 'conflict' | 'error';
  @text('sync_error') syncError!: string;
  @date('last_sync_at') lastSyncAt!: Date;

  // Auditoría
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @text('created_by') createdBy!: string;
  @text('updated_by') updatedBy!: string;

  // Campos offline
  @field('offline_created') offlineCreated!: boolean;
  @field('offline_updated') offlineUpdated!: boolean;
  @field('offline_deleted') offlineDeleted!: boolean;

  // Relaciones
  @children('actividades') actividades!: any;

  // Métodos de instancia

  /**
   * Calcula el centro de la parcela
   */
  getCentroid(): { lat: number; lng: number } {
    if (this.geometria.type === 'Point') {
      const coords = this.geometria.coordinates as number[];
      return { lat: coords[1], lng: coords[0] };
    }
    
    // Para polígonos, calcular centroide
    const coords = this.geometria.coordinates as number[][][];
    if (coords.length === 0 || coords[0].length === 0) {
      return { lat: this.latitud, lng: this.longitud };
    }
    
    let totalLat = 0;
    let totalLng = 0;
    let pointCount = 0;
    
    coords[0].forEach(([lng, lat]) => {
      totalLat += lat;
      totalLng += lng;
      pointCount++;
    });
    
    return {
      lat: totalLat / pointCount,
      lng: totalLng / pointCount,
    };
  }

  /**
   * Verifica si un punto está dentro de la parcela
   */
  containsPoint(lat: number, lng: number): boolean {
    if (this.geometria.type === 'Point') {
      // Para puntos, verificar proximidad (radio de 100m)
      const distance = this.calculateDistance(lat, lng, this.latitud, this.longitud);
      return distance <= 0.1; // 100 metros
    }

    // Para polígonos, usar ray casting algorithm
    const coords = this.geometria.coordinates as number[][][];
    if (coords.length === 0 || coords[0].length === 0) return false;

    return this.pointInPolygon([lng, lat], coords[0]);
  }

  /**
   * Calcula la distancia desde un punto a la parcela
   */
  distanceToPoint(lat: number, lng: number): number {
    if (this.geometria.type === 'Point') {
      return this.calculateDistance(lat, lng, this.latitud, this.longitud);
    }

    // Para polígonos, calcular distancia al centroide
    const centroid = this.getCentroid();
    return this.calculateDistance(lat, lng, centroid.lat, centroid.lng);
  }

  /**
   * Obtiene el área cultivable actual
   */
  getAreaCultivable(): number {
    return this.cultivo.superficie_cultivada || this.superficie;
  }

  /**
   * Verifica si la parcela está activa
   */
  isActive(): boolean {
    return this.cultivo.estado === 'activo';
  }

  /**
   * Obtiene información de SIGPAC si está disponible
   */
  getSigpacInfo(): string | null {
    return this.metadatos.sigpac_referencia || null;
  }

  /**
   * Verifica si la parcela necesita sincronización
   */
  needsSync(): boolean {
    return this.syncStatus !== 'synced' || this.offlineCreated || this.offlineUpdated;
  }

  /**
   * Marca la parcela para eliminación offline
   */
  @writer async markForDeletion() {
    await this.update((parcela) => {
      parcela.offlineDeleted = true;
      parcela.syncStatus = 'pending';
    });
  }

  /**
   * Marca la parcela como sincronizada
   */
  @writer async markAsSynced() {
    await this.update((parcela) => {
      parcela.syncStatus = 'synced';
      parcela.offlineCreated = false;
      parcela.offlineUpdated = false;
      parcela.syncError = '';
      parcela.lastSyncAt = new Date();
    });
  }

  /**
   * Marca la parcela con error de sincronización
   */
  @writer async markSyncError(error: string) {
    await this.update((parcela) => {
      parcela.syncStatus = 'error';
      parcela.syncError = error;
    });
  }

  // Métodos privados de utilidad

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

  private pointInPolygon(point: number[], polygon: number[][]): boolean {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  // Métodos estáticos para crear parcelas

  /**
   * Crea una nueva parcela desde coordenadas GPS
   */
  static async createFromGPS(
    database: any,
    gpsData: {
      lat: number;
      lng: number;
      accuracy?: number;
    },
    basicInfo: {
      nombre: string;
      descripcion?: string;
      superficie: number;
    },
    cultivoInfo: ParcelaCultivo,
    userId: string
  ) {
    const parcela = await database.write(async () => {
      return database.get('parcelas').create((parcela: Parcela) => {
        // Información básica
        parcela.nombre = basicInfo.nombre;
        parcela.descripcion = basicInfo.descripcion || '';
        parcela.superficie = basicInfo.superficie;
        parcela.ubicacion = `${gpsData.lat.toFixed(6)}, ${gpsData.lng.toFixed(6)}`;

        // Geometría como punto
        parcela.geometria = {
          type: 'Point',
          coordinates: [gpsData.lng, gpsData.lat],
        };
        parcela.latitud = gpsData.lat;
        parcela.longitud = gpsData.lng;

        // Información de cultivo
        parcela.cultivo = cultivoInfo;

        // Metadatos iniciales
        parcela.metadatos = {
          regimen_tenencia: 'propiedad',
          uso_principal: 'secano',
        };

        // Estado de sincronización
        parcela.syncStatus = 'pending';
        parcela.offlineCreated = true;
        parcela.createdBy = userId;
        parcela.updatedBy = userId;
      });
    });

    return parcela;
  }

  /**
   * Crea una parcela desde datos de SIGPAC
   */
  static async createFromSIGPAC(
    database: any,
    sigpacData: {
      referencia: string;
      geometria: ParcelaGeometria;
      superficie: number;
      municipio: string;
      provincia: string;
    },
    basicInfo: {
      nombre: string;
      descripcion?: string;
    },
    cultivoInfo: ParcelaCultivo,
    userId: string
  ) {
    const centroid = this.calculatePolygonCentroid(sigpacData.geometria);
    
    const parcela = await database.write(async () => {
      return database.get('parcelas').create((parcela: Parcela) => {
        // Información básica
        parcela.nombre = basicInfo.nombre;
        parcela.descripcion = basicInfo.descripcion || '';
        parcela.superficie = sigpacData.superficie;
        parcela.ubicacion = `${sigpacData.municipio}, ${sigpacData.provincia}`;

        // Geometría desde SIGPAC
        parcela.geometria = sigpacData.geometria;
        parcela.latitud = centroid.lat;
        parcela.longitud = centroid.lng;

        // Información de cultivo
        parcela.cultivo = cultivoInfo;

        // Metadatos desde SIGPAC
        parcela.metadatos = {
          sigpac_referencia: sigpacData.referencia,
          municipio: sigpacData.municipio,
          provincia: sigpacData.provincia,
          regimen_tenencia: 'propiedad',
          uso_principal: 'secano',
        };

        // Estado de sincronización
        parcela.syncStatus = 'pending';
        parcela.offlineCreated = true;
        parcela.createdBy = userId;
        parcela.updatedBy = userId;
      });
    });

    return parcela;
  }

  private static calculatePolygonCentroid(geometria: ParcelaGeometria): { lat: number; lng: number } {
    if (geometria.type === 'Point') {
      const coords = geometria.coordinates as number[];
      return { lat: coords[1], lng: coords[0] };
    }

    const coords = geometria.coordinates as number[][][];
    if (coords.length === 0 || coords[0].length === 0) {
      return { lat: 0, lng: 0 };
    }

    let totalLat = 0;
    let totalLng = 0;
    let pointCount = 0;

    coords[0].forEach(([lng, lat]) => {
      totalLat += lat;
      totalLng += lng;
      pointCount++;
    });

    return {
      lat: totalLat / pointCount,
      lng: totalLng / pointCount,
    };
  }
}