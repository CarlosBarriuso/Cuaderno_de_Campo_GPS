// Actividad.ts - Modelo WatermelonDB para actividades agrícolas
import { Model } from '@nozbe/watermelondb';
import { field, text, json, date, readonly, relation, writer } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export interface ActividadUbicacion {
  latitud: number;
  longitud: number;
  precision?: number;
  altitud?: number;
  timestamp: string;
}

export interface ActividadProducto {
  id?: string;
  nombre: string;
  tipo: 'herbicida' | 'fungicida' | 'insecticida' | 'fertilizante' | 'semilla' | 'otro';
  marca?: string;
  principio_activo?: string;
  dosis: number;
  unidad: 'l/ha' | 'kg/ha' | 'g/ha' | 'ml/ha' | 'kg' | 'l' | 'unidades';
  numero_registro?: string;
  lote?: string;
  fecha_caducidad?: string;
  precio_unidad?: number;
  proveedor?: string;
}

export interface ActividadMaquinaria {
  id?: string;
  nombre: string;
  tipo: 'tractor' | 'pulverizador' | 'sembradora' | 'cosechadora' | 'cultivador' | 'arado' | 'otro';
  marca?: string;
  modelo?: string;
  matricula?: string;
  horas_trabajadas?: number;
  combustible_consumido?: number;
  operario?: string;
}

export interface ActividadCondicionesMeteo {
  temperatura?: number;
  humedad?: number;
  viento_velocidad?: number;
  viento_direccion?: number;
  precipitacion?: number;
  presion?: number;
  observaciones?: string;
}

export interface ActividadCostos {
  productos: number;
  mano_obra: number;
  maquinaria: number;
  combustible: number;
  otros: number;
  total: number;
  moneda: 'EUR' | 'USD';
}

export interface ActividadResultados {
  superficie_tratada?: number;
  plantas_contadas?: number;
  rendimiento?: number;
  calidad?: string;
  mermas?: number;
  observaciones?: string;
}

export default class Actividad extends Model {
  static table = 'actividades';
  
  static associations: Associations = {
    parcela: { type: 'belongs_to', key: 'parcela_id' },
  };

  // Relación con parcela
  @relation('parcelas', 'parcela_id') parcela!: any;

  // Información básica
  @text('nombre') nombre!: string;
  @text('tipo') tipo!: string; // siembra, tratamiento, cosecha, etc.
  @text('subtipo') subtipo!: string; // herbicida, fertilizante, etc.
  @text('descripcion') descripcion!: string;
  @date('fecha_inicio') fechaInicio!: Date;
  @date('fecha_fin') fechaFin!: Date;
  @field('duracion_minutos') duracionMinutos!: number;

  // Estado de la actividad
  @text('estado') estado!: string; // planificada, en_progreso, completada, cancelada
  @field('progreso') progreso!: number; // 0-100

  // Ubicación GPS
  @json('ubicacion', (json) => json) ubicacion!: ActividadUbicacion;

  // Productos utilizados
  @json('productos', (json) => json) productos!: ActividadProducto[];

  // Maquinaria utilizada
  @json('maquinaria', (json) => json) maquinaria!: ActividadMaquinaria[];

  // Condiciones meteorológicas
  @json('condiciones_meteo', (json) => json) condicionesMeteo!: ActividadCondicionesMeteo;

  // Información de costos
  @json('costos', (json) => json) costos!: ActividadCostos;

  // Resultados de la actividad
  @json('resultados', (json) => json) resultados!: ActividadResultados;

  // Documentación
  @json('fotos', (json) => json) fotos!: string[]; // URLs o paths locales
  @json('documentos', (json) => json) documentos!: string[];

  // Notas y observaciones
  @text('notas') notas!: string;
  @text('observaciones') observaciones!: string;

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

  // Validaciones y cumplimiento
  @field('requiere_plazo_seguridad') requierePlazoSeguridad!: boolean;
  @field('plazo_seguridad_dias') plazoSeguridadDias!: number;
  @field('cumple_normativa') cumpleNormativa!: boolean;
  @text('alertas_normativas') alertasNormativas!: string;

  // Métodos de instancia

  /**
   * Calcula el costo total de la actividad
   */
  calcularCostoTotal(): number {
    if (!this.costos) return 0;
    return this.costos.total || (
      this.costos.productos +
      this.costos.mano_obra +
      this.costos.maquinaria +
      this.costos.combustible +
      this.costos.otros
    );
  }

  /**
   * Obtiene el costo por hectárea
   */
  getCostoPorHectarea(superficie: number): number {
    if (superficie <= 0) return 0;
    return this.calcularCostoTotal() / superficie;
  }

  /**
   * Verifica si la actividad está completada
   */
  isCompleted(): boolean {
    return this.estado === 'completada' && this.progreso >= 100;
  }

  /**
   * Verifica si la actividad está en progreso
   */
  isInProgress(): boolean {
    return this.estado === 'en_progreso';
  }

  /**
   * Verifica si la actividad puede iniciarse
   */
  canStart(): boolean {
    return this.estado === 'planificada' && new Date() >= this.fechaInicio;
  }

  /**
   * Calcula la duración real de la actividad
   */
  getDuracionReal(): number {
    if (!this.fechaFin || !this.fechaInicio) return 0;
    return (this.fechaFin.getTime() - this.fechaInicio.getTime()) / (1000 * 60); // minutos
  }

  /**
   * Obtiene el rendimiento por hectárea si aplica
   */
  getRendimientoPorHectarea(superficie: number): number | null {
    if (!this.resultados?.rendimiento || superficie <= 0) return null;
    return this.resultados.rendimiento / superficie;
  }

  /**
   * Verifica si cumple con los plazos de seguridad
   */
  cumplePlazosSeguridad(): boolean {
    if (!this.requierePlazoSeguridad) return true;
    
    const diasTranscurridos = Math.floor(
      (Date.now() - this.fechaFin.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return diasTranscurridos >= this.plazoSeguridadDias;
  }

  /**
   * Obtiene alertas de cumplimiento normativo
   */
  getAlertasNormativas(): string[] {
    if (!this.alertasNormativas) return [];
    return this.alertasNormativas.split('|').filter(Boolean);
  }

  /**
   * Calcula la distancia desde una ubicación
   */
  distanceFromLocation(lat: number, lng: number): number {
    if (!this.ubicacion) return Infinity;
    
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat - this.ubicacion.latitud);
    const dLng = this.toRadians(lng - this.ubicacion.longitud);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(this.ubicacion.latitud)) * Math.cos(this.toRadians(lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Verifica si necesita sincronización
   */
  needsSync(): boolean {
    return this.syncStatus !== 'synced' || this.offlineCreated || this.offlineUpdated;
  }

  /**
   * Inicia la actividad
   */
  @writer async iniciar() {
    await this.update((actividad) => {
      actividad.estado = 'en_progreso';
      actividad.fechaInicio = new Date();
      actividad.progreso = 0;
      actividad.offlineUpdated = true;
      actividad.syncStatus = 'pending';
    });
  }

  /**
   * Completa la actividad
   */
  @writer async completar(resultados?: Partial<ActividadResultados>) {
    await this.update((actividad) => {
      actividad.estado = 'completada';
      actividad.fechaFin = new Date();
      actividad.progreso = 100;
      
      if (resultados) {
        actividad.resultados = { ...actividad.resultados, ...resultados };
      }
      
      actividad.offlineUpdated = true;
      actividad.syncStatus = 'pending';
    });
  }

  /**
   * Actualiza el progreso de la actividad
   */
  @writer async actualizarProgreso(progreso: number, notas?: string) {
    await this.update((actividad) => {
      actividad.progreso = Math.max(0, Math.min(100, progreso));
      
      if (notas) {
        actividad.notas = notas;
      }
      
      actividad.offlineUpdated = true;
      actividad.syncStatus = 'pending';
    });
  }

  /**
   * Agrega un producto utilizado
   */
  @writer async agregarProducto(producto: ActividadProducto) {
    await this.update((actividad) => {
      const productos = [...actividad.productos];
      productos.push({ ...producto, id: this.generateId() });
      actividad.productos = productos;
      actividad.offlineUpdated = true;
      actividad.syncStatus = 'pending';
    });
  }

  /**
   * Agrega maquinaria utilizada
   */
  @writer async agregarMaquinaria(maquinaria: ActividadMaquinaria) {
    await this.update((actividad) => {
      const maquinarias = [...actividad.maquinaria];
      maquinarias.push({ ...maquinaria, id: this.generateId() });
      actividad.maquinaria = maquinarias;
      actividad.offlineUpdated = true;
      actividad.syncStatus = 'pending';
    });
  }

  /**
   * Actualiza las condiciones meteorológicas
   */
  @writer async actualizarCondicionesMeteo(condiciones: ActividadCondicionesMeteo) {
    await this.update((actividad) => {
      actividad.condicionesMeteo = { ...actividad.condicionesMeteo, ...condiciones };
      actividad.offlineUpdated = true;
      actividad.syncStatus = 'pending';
    });
  }

  /**
   * Agrega una foto
   */
  @writer async agregarFoto(fotoPath: string) {
    await this.update((actividad) => {
      const fotos = [...actividad.fotos];
      fotos.push(fotoPath);
      actividad.fotos = fotos;
      actividad.offlineUpdated = true;
      actividad.syncStatus = 'pending';
    });
  }

  /**
   * Marca la actividad para eliminación offline
   */
  @writer async markForDeletion() {
    await this.update((actividad) => {
      actividad.offlineDeleted = true;
      actividad.syncStatus = 'pending';
    });
  }

  /**
   * Marca la actividad como sincronizada
   */
  @writer async markAsSynced() {
    await this.update((actividad) => {
      actividad.syncStatus = 'synced';
      actividad.offlineCreated = false;
      actividad.offlineUpdated = false;
      actividad.syncError = '';
      actividad.lastSyncAt = new Date();
    });
  }

  /**
   * Marca la actividad con error de sincronización
   */
  @writer async markSyncError(error: string) {
    await this.update((actividad) => {
      actividad.syncStatus = 'error';
      actividad.syncError = error;
    });
  }

  // Métodos privados de utilidad

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Métodos estáticos para crear actividades

  /**
   * Crea una nueva actividad básica
   */
  static async create(
    database: any,
    parcelaId: string,
    actividadData: {
      nombre: string;
      tipo: string;
      subtipo?: string;
      descripcion?: string;
      fechaInicio: Date;
      ubicacion: ActividadUbicacion;
    },
    userId: string
  ) {
    const actividad = await database.write(async () => {
      return database.get('actividades').create((actividad: Actividad) => {
        // Información básica
        actividad._raw.parcela_id = parcelaId;
        actividad.nombre = actividadData.nombre;
        actividad.tipo = actividadData.tipo;
        actividad.subtipo = actividadData.subtipo || '';
        actividad.descripcion = actividadData.descripcion || '';
        actividad.fechaInicio = actividadData.fechaInicio;
        actividad.fechaFin = actividadData.fechaInicio; // Inicialmente igual al inicio
        actividad.duracionMinutos = 0;

        // Estado inicial
        actividad.estado = 'planificada';
        actividad.progreso = 0;

        // Ubicación
        actividad.ubicacion = actividadData.ubicacion;

        // Inicializar arrays vacíos
        actividad.productos = [];
        actividad.maquinaria = [];
        actividad.fotos = [];
        actividad.documentos = [];

        // Inicializar objetos vacíos
        actividad.condicionesMeteo = {};
        actividad.costos = {
          productos: 0,
          mano_obra: 0,
          maquinaria: 0,
          combustible: 0,
          otros: 0,
          total: 0,
          moneda: 'EUR',
        };
        actividad.resultados = {};

        // Campos de texto
        actividad.notas = '';
        actividad.observaciones = '';

        // Validaciones
        actividad.requierePlazoSeguridad = false;
        actividad.plazoSeguridadDias = 0;
        actividad.cumpleNormativa = true;
        actividad.alertasNormativas = '';

        // Estado de sincronización
        actividad.syncStatus = 'pending';
        actividad.offlineCreated = true;
        actividad.createdBy = userId;
        actividad.updatedBy = userId;
      });
    });

    return actividad;
  }

  /**
   * Crea una actividad de tratamiento fitosanitario
   */
  static async createTratamiento(
    database: any,
    parcelaId: string,
    tratamientoData: {
      nombre: string;
      tipoTratamiento: 'herbicida' | 'fungicida' | 'insecticida';
      productos: ActividadProducto[];
      fechaInicio: Date;
      ubicacion: ActividadUbicacion;
      plazoSeguridad?: number;
    },
    userId: string
  ) {
    const actividad = await database.write(async () => {
      return database.get('actividades').create((actividad: Actividad) => {
        // Información básica
        actividad._raw.parcela_id = parcelaId;
        actividad.nombre = tratamientoData.nombre;
        actividad.tipo = 'tratamiento';
        actividad.subtipo = tratamientoData.tipoTratamiento;
        actividad.descripcion = `Tratamiento ${tratamientoData.tipoTratamiento}`;
        actividad.fechaInicio = tratamientoData.fechaInicio;
        actividad.fechaFin = tratamientoData.fechaInicio;

        // Estado inicial
        actividad.estado = 'planificada';
        actividad.progreso = 0;

        // Ubicación
        actividad.ubicacion = tratamientoData.ubicacion;

        // Productos
        actividad.productos = tratamientoData.productos.map(producto => ({
          ...producto,
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        }));

        // Inicializar otros campos
        actividad.maquinaria = [];
        actividad.fotos = [];
        actividad.documentos = [];
        actividad.condicionesMeteo = {};
        actividad.costos = {
          productos: 0,
          mano_obra: 0,
          maquinaria: 0,
          combustible: 0,
          otros: 0,
          total: 0,
          moneda: 'EUR',
        };
        actividad.resultados = {};
        actividad.notas = '';
        actividad.observaciones = '';

        // Validaciones para tratamientos fitosanitarios
        actividad.requierePlazoSeguridad = true;
        actividad.plazoSeguridadDias = tratamientoData.plazoSeguridad || 7;
        actividad.cumpleNormativa = true;
        actividad.alertasNormativas = '';

        // Estado de sincronización
        actividad.syncStatus = 'pending';
        actividad.offlineCreated = true;
        actividad.createdBy = userId;
        actividad.updatedBy = userId;
      });
    });

    return actividad;
  }
}