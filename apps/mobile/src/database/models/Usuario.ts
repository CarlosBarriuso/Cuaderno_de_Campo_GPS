// Usuario.ts - Modelo WatermelonDB para usuarios
import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export interface UsuarioPreferencias {
  idioma: 'es' | 'en' | 'ca' | 'eu' | 'gl';
  tema: 'light' | 'dark' | 'auto';
  unidades: 'metric' | 'imperial';
  formato_fecha: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
  moneda_preferida: 'EUR' | 'USD';
  cultivos_principales: string[];
  zona_horaria: string;
  auto_sync: boolean;
  sync_interval: number; // minutos
  gps_precision: 'high' | 'medium' | 'low';
  foto_calidad: 'high' | 'medium' | 'low';
  backup_automatico: boolean;
}

export default class Usuario extends Model {
  static table = 'usuarios';

  // Información básica
  @text('clerk_id') clerkId!: string;
  @text('email') email!: string;
  @text('nombre') nombre!: string;
  @text('apellidos') apellidos!: string;
  @text('telefono') telefono!: string;

  // Información agrícola
  @text('tipo_usuario') tipoUsuario!: string;
  @text('empresa') empresa!: string;
  @text('nif_cif') nifCif!: string;
  @text('direccion') direccion!: string;
  @text('municipio') municipio!: string;
  @text('provincia') provincia!: string;
  @text('codigo_postal') codigoPostal!: string;

  // Preferencias de la aplicación (JSON)
  @text('preferencias') preferenciasSerialized!: string;

  // Configuración de notificaciones
  @field('notificaciones_push') notificacionesPush!: boolean;
  @field('notificaciones_email') notificacionesEmail!: boolean;
  @field('notificaciones_sms') notificacionesSms!: boolean;

  // Estado de sincronización
  @field('sync_status') syncStatus!: 'synced' | 'pending' | 'conflict' | 'error';
  @text('sync_error') syncError!: string;
  @date('last_sync_at') lastSyncAt!: Date;

  // Auditoría
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @date('last_login_at') lastLoginAt!: Date;

  // Campos offline
  @field('offline_created') offlineCreated!: boolean;
  @field('offline_updated') offlineUpdated!: boolean;
  @field('offline_deleted') offlineDeleted!: boolean;

  // Estado del usuario
  @field('activo') activo!: boolean;
  @field('email_verificado') emailVerificado!: boolean;
  @field('onboarding_completado') onboardingCompletado!: boolean;

  // Getters y setters para preferencias

  get preferencias(): UsuarioPreferencias {
    try {
      return JSON.parse(this.preferenciasSerialized || '{}');
    } catch {
      return this.getDefaultPreferencias();
    }
  }

  private getDefaultPreferencias(): UsuarioPreferencias {
    return {
      idioma: 'es',
      tema: 'auto',
      unidades: 'metric',
      formato_fecha: 'dd/mm/yyyy',
      moneda_preferida: 'EUR',
      cultivos_principales: [],
      zona_horaria: 'Europe/Madrid',
      auto_sync: true,
      sync_interval: 15,
      gps_precision: 'high',
      foto_calidad: 'high',
      backup_automatico: true,
    };
  }

  // Métodos de instancia

  /**
   * Obtiene el nombre completo del usuario
   */
  getNombreCompleto(): string {
    return `${this.nombre} ${this.apellidos}`.trim();
  }

  /**
   * Verifica si el usuario está activo
   */
  isActive(): boolean {
    return this.activo && this.emailVerificado;
  }

  /**
   * Verifica si el usuario ha completado el onboarding
   */
  hasCompletedOnboarding(): boolean {
    return this.onboardingCompletado;
  }

  /**
   * Verifica si el usuario necesita sincronización
   */
  needsSync(): boolean {
    return this.syncStatus !== 'synced' || this.offlineCreated || this.offlineUpdated;
  }

  /**
   * Obtiene los cultivos principales del usuario
   */
  getCultivosPrincipales(): string[] {
    return this.preferencias.cultivos_principales || [];
  }

  /**
   * Verifica si tiene un cultivo específico
   */
  hasCultivo(cultivo: string): boolean {
    return this.getCultivosPrincipales().includes(cultivo.toLowerCase());
  }

  /**
   * Obtiene la configuración regional del usuario
   */
  getConfiguracionRegional(): {
    idioma: string;
    moneda: string;
    formatoFecha: string;
    zonaHoraria: string;
  } {
    const prefs = this.preferencias;
    return {
      idioma: prefs.idioma,
      moneda: prefs.moneda_preferida,
      formatoFecha: prefs.formato_fecha,
      zonaHoraria: prefs.zona_horaria,
    };
  }

  /**
   * Verifica si tiene notificaciones habilitadas
   */
  hasNotificationsEnabled(): boolean {
    return this.notificacionesPush || this.notificacionesEmail || this.notificacionesSms;
  }

  /**
   * Obtiene el tiempo desde el último login
   */
  getTimeSinceLastLogin(): number {
    if (!this.lastLoginAt) return Infinity;
    return Date.now() - this.lastLoginAt.getTime();
  }

  /**
   * Verifica si es un usuario inactivo
   */
  isInactiveUser(): boolean {
    const daysSinceLogin = this.getTimeSinceLastLogin() / (1000 * 60 * 60 * 24);
    return daysSinceLogin > 30; // Más de 30 días sin login
  }

  // Métodos de escritura

  /**
   * Actualiza las preferencias del usuario
   */
  @writer async updatePreferencias(nuevasPreferencias: Partial<UsuarioPreferencias>) {
    await this.update((usuario) => {
      const prefs = { ...usuario.preferencias, ...nuevasPreferencias };
      usuario.preferenciasSerialized = JSON.stringify(prefs);
      usuario.offlineUpdated = true;
      usuario.syncStatus = 'pending';
    });
  }

  /**
   * Actualiza la información de contacto
   */
  @writer async updateContacto(contacto: {
    telefono?: string;
    email?: string;
    direccion?: string;
    municipio?: string;
    provincia?: string;
    codigoPostal?: string;
  }) {
    await this.update((usuario) => {
      if (contacto.telefono !== undefined) usuario.telefono = contacto.telefono;
      if (contacto.email !== undefined) usuario.email = contacto.email;
      if (contacto.direccion !== undefined) usuario.direccion = contacto.direccion;
      if (contacto.municipio !== undefined) usuario.municipio = contacto.municipio;
      if (contacto.provincia !== undefined) usuario.provincia = contacto.provincia;
      if (contacto.codigoPostal !== undefined) usuario.codigoPostal = contacto.codigoPostal;
      
      usuario.offlineUpdated = true;
      usuario.syncStatus = 'pending';
    });
  }

  /**
   * Actualiza la configuración de notificaciones
   */
  @writer async updateNotificaciones(notificaciones: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  }) {
    await this.update((usuario) => {
      if (notificaciones.push !== undefined) usuario.notificacionesPush = notificaciones.push;
      if (notificaciones.email !== undefined) usuario.notificacionesEmail = notificaciones.email;
      if (notificaciones.sms !== undefined) usuario.notificacionesSms = notificaciones.sms;
      
      usuario.offlineUpdated = true;
      usuario.syncStatus = 'pending';
    });
  }

  /**
   * Marca el último acceso del usuario
   */
  @writer async updateLastLogin() {
    await this.update((usuario) => {
      usuario.lastLoginAt = new Date();
      usuario.offlineUpdated = true;
      usuario.syncStatus = 'pending';
    });
  }

  /**
   * Completa el onboarding del usuario
   */
  @writer async completeOnboarding() {
    await this.update((usuario) => {
      usuario.onboardingCompletado = true;
      usuario.offlineUpdated = true;
      usuario.syncStatus = 'pending';
    });
  }

  /**
   * Agrega un cultivo principal
   */
  @writer async addCultivoPrincipal(cultivo: string) {
    const cultivoLower = cultivo.toLowerCase();
    const cultivos = this.getCultivosPrincipales();
    
    if (!cultivos.includes(cultivoLower)) {
      cultivos.push(cultivoLower);
      await this.updatePreferencias({ cultivos_principales: cultivos });
    }
  }

  /**
   * Elimina un cultivo principal
   */
  @writer async removeCultivoPrincipal(cultivo: string) {
    const cultivoLower = cultivo.toLowerCase();
    const cultivos = this.getCultivosPrincipales().filter(c => c !== cultivoLower);
    await this.updatePreferencias({ cultivos_principales: cultivos });
  }

  /**
   * Marca el usuario como sincronizado
   */
  @writer async markAsSynced() {
    await this.update((usuario) => {
      usuario.syncStatus = 'synced';
      usuario.offlineCreated = false;
      usuario.offlineUpdated = false;
      usuario.syncError = '';
      usuario.lastSyncAt = new Date();
    });
  }

  /**
   * Marca el usuario con error de sincronización
   */
  @writer async markSyncError(error: string) {
    await this.update((usuario) => {
      usuario.syncStatus = 'error';
      usuario.syncError = error;
    });
  }

  // Métodos estáticos

  /**
   * Crea un nuevo usuario desde datos de Clerk
   */
  static async createFromClerk(
    database: any,
    clerkData: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
    }
  ) {
    const usuario = await database.write(async () => {
      return database.get('usuarios').create((usuario: Usuario) => {
        // Información básica desde Clerk
        usuario.clerkId = clerkData.id;
        usuario.email = clerkData.email;
        usuario.nombre = clerkData.firstName || '';
        usuario.apellidos = clerkData.lastName || '';
        usuario.telefono = clerkData.phoneNumber || '';

        // Valores por defecto
        usuario.tipoUsuario = 'agricultor';
        usuario.empresa = '';
        usuario.nifCif = '';
        usuario.direccion = '';
        usuario.municipio = '';
        usuario.provincia = '';
        usuario.codigoPostal = '';

        // Preferencias por defecto
        usuario.preferenciasSerialized = JSON.stringify(usuario.getDefaultPreferencias());

        // Notificaciones habilitadas por defecto
        usuario.notificacionesPush = true;
        usuario.notificacionesEmail = true;
        usuario.notificacionesSms = false;

        // Estado inicial
        usuario.activo = true;
        usuario.emailVerificado = true; // Clerk ya verifica el email
        usuario.onboardingCompletado = false;

        // Estado de sincronización
        usuario.syncStatus = 'pending';
        usuario.offlineCreated = true;
        usuario.syncError = '';
      });
    });

    return usuario;
  }

  /**
   * Busca un usuario por Clerk ID
   */
  static async findByClerkId(database: any, clerkId: string): Promise<Usuario | null> {
    const usuarios = await database.get('usuarios').query().fetch();
    return usuarios.find((u: Usuario) => u.clerkId === clerkId) || null;
  }

  /**
   * Busca un usuario por email
   */
  static async findByEmail(database: any, email: string): Promise<Usuario | null> {
    const usuarios = await database.get('usuarios').query().fetch();
    return usuarios.find((u: Usuario) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
}