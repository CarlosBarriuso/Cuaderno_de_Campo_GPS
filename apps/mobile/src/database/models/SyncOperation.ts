// SyncOperation.ts - Modelo WatermelonDB para operaciones de sincronización
import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export interface SyncOperationData {
  [key: string]: any;
}

export interface SyncConflictResolution {
  strategy: 'server_wins' | 'client_wins' | 'manual' | 'merge';
  resolved_by?: string;
  resolved_at?: number;
  resolution_data?: any;
}

export default class SyncOperation extends Model {
  static table = 'sync_operations';

  // Información de la operación
  @text('operation_id') operationId!: string;
  @text('operation_type') operationType!: 'create' | 'update' | 'delete';
  @text('table_name') tableName!: string;
  @text('record_id') recordId!: string;

  // Datos de la operación
  @text('data') dataSerialized!: string;
  @text('previous_data') previousDataSerialized!: string;

  // Estado de la operación
  @text('status') status!: 'pending' | 'synced' | 'error' | 'conflict';
  @text('error_message') errorMessage!: string;
  @field('retry_count') retryCount!: number;
  @field('max_retries') maxRetries!: number;

  // Timestamps
  @readonly @date('created_at') createdAt!: Date;
  @date('last_attempt_at') lastAttemptAt!: Date;
  @date('synced_at') syncedAt!: Date;

  // Metadatos de sincronización
  @text('sync_batch_id') syncBatchId!: string;
  @text('conflict_resolution') conflictResolutionSerialized!: string;
  @field('server_timestamp') serverTimestamp!: number;

  // Información del usuario
  @text('user_id') userId!: string;
  @text('device_id') deviceId!: string;

  // Prioridad y dependencias
  @field('priority') priority!: number;
  @text('depends_on') dependsOnSerialized!: string;

  // Flags de control
  @field('requires_online') requiresOnline!: boolean;
  @field('can_rollback') canRollback!: boolean;
  @field('auto_retry') autoRetry!: boolean;

  // Getters para datos JSON

  get data(): SyncOperationData {
    try {
      return JSON.parse(this.dataSerialized || '{}');
    } catch {
      return {};
    }
  }

  get previousData(): SyncOperationData | null {
    try {
      return this.previousDataSerialized ? JSON.parse(this.previousDataSerialized) : null;
    } catch {
      return null;
    }
  }

  get conflictResolution(): SyncConflictResolution | null {
    try {
      return this.conflictResolutionSerialized ? JSON.parse(this.conflictResolutionSerialized) : null;
    } catch {
      return null;
    }
  }

  get dependsOn(): string[] {
    try {
      return JSON.parse(this.dependsOnSerialized || '[]');
    } catch {
      return [];
    }
  }

  // Métodos de instancia

  /**
   * Verifica si la operación está pendiente
   */
  isPending(): boolean {
    return this.status === 'pending';
  }

  /**
   * Verifica si la operación ha sido sincronizada
   */
  isSynced(): boolean {
    return this.status === 'synced';
  }

  /**
   * Verifica si la operación tiene un error
   */
  hasError(): boolean {
    return this.status === 'error';
  }

  /**
   * Verifica si la operación tiene un conflicto
   */
  hasConflict(): boolean {
    return this.status === 'conflict';
  }

  /**
   * Verifica si puede reintentarse
   */
  canRetry(): boolean {
    return this.retryCount < this.maxRetries && this.autoRetry;
  }

  /**
   * Verifica si la operación ha expirado
   */
  isExpired(): boolean {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días
    return Date.now() - this.createdAt.getTime() > maxAge;
  }

  /**
   * Obtiene el tiempo desde el último intento
   */
  getTimeSinceLastAttempt(): number {
    if (!this.lastAttemptAt) return Infinity;
    return Date.now() - this.lastAttemptAt.getTime();
  }

  /**
   * Calcula el siguiente tiempo de reintento (backoff exponencial)
   */
  getNextRetryDelay(): number {
    const baseDelay = 1000; // 1 segundo
    const multiplier = 2;
    const maxDelay = 5 * 60 * 1000; // 5 minutos

    const delay = Math.min(baseDelay * Math.pow(multiplier, this.retryCount), maxDelay);
    return delay;
  }

  /**
   * Verifica si está listo para reintento
   */
  isReadyForRetry(): boolean {
    if (!this.canRetry()) return false;
    if (this.requiresOnline && !navigator.onLine) return false;
    
    const timeSinceLastAttempt = this.getTimeSinceLastAttempt();
    const nextRetryDelay = this.getNextRetryDelay();
    
    return timeSinceLastAttempt >= nextRetryDelay;
  }

  /**
   * Obtiene información del conflicto si existe
   */
  getConflictInfo(): {
    hasConflict: boolean;
    strategy?: string;
    canResolve: boolean;
    requiresManualResolution: boolean;
  } {
    const resolution = this.conflictResolution;
    
    return {
      hasConflict: this.hasConflict(),
      strategy: resolution?.strategy,
      canResolve: this.hasConflict() && !resolution,
      requiresManualResolution: this.hasConflict() && resolution?.strategy === 'manual',
    };
  }

  /**
   * Verifica si tiene dependencias sin resolver
   */
  async hasUnresolvedDependencies(database: any): Promise<boolean> {
    const dependencies = this.dependsOn;
    if (dependencies.length === 0) return false;

    const operations = await database.get('sync_operations').query().fetch();
    
    for (const depId of dependencies) {
      const dependency = operations.find((op: SyncOperation) => op.operationId === depId);
      if (!dependency || !dependency.isSynced()) {
        return true;
      }
    }

    return false;
  }

  // Métodos de escritura

  /**
   * Marca la operación como iniciada
   */
  @writer async markAsStarted() {
    await this.update((operation) => {
      operation.lastAttemptAt = new Date();
      operation.retryCount += 1;
    });
  }

  /**
   * Marca la operación como sincronizada exitosamente
   */
  @writer async markAsSynced(serverTimestamp?: number) {
    await this.update((operation) => {
      operation.status = 'synced';
      operation.syncedAt = new Date();
      operation.errorMessage = '';
      
      if (serverTimestamp) {
        operation.serverTimestamp = serverTimestamp;
      }
    });
  }

  /**
   * Marca la operación con error
   */
  @writer async markAsError(errorMessage: string) {
    await this.update((operation) => {
      operation.status = 'error';
      operation.errorMessage = errorMessage;
      operation.lastAttemptAt = new Date();
    });
  }

  /**
   * Marca la operación como conflicto
   */
  @writer async markAsConflict(conflictData: any) {
    await this.update((operation) => {
      operation.status = 'conflict';
      operation.conflictResolutionSerialized = JSON.stringify({
        strategy: 'manual',
        conflict_data: conflictData,
        detected_at: Date.now(),
      });
    });
  }

  /**
   * Resuelve un conflicto
   */
  @writer async resolveConflict(
    strategy: 'server_wins' | 'client_wins' | 'merge',
    resolutionData?: any,
    resolvedBy?: string
  ) {
    await this.update((operation) => {
      const resolution: SyncConflictResolution = {
        strategy,
        resolved_by: resolvedBy,
        resolved_at: Date.now(),
        resolution_data: resolutionData,
      };
      
      operation.conflictResolutionSerialized = JSON.stringify(resolution);
      operation.status = 'pending'; // Reintentará con la resolución
    });
  }

  /**
   * Actualiza los datos de la operación
   */
  @writer async updateData(newData: SyncOperationData) {
    await this.update((operation) => {
      operation.dataSerialized = JSON.stringify(newData);
    });
  }

  /**
   * Agrega una dependencia
   */
  @writer async addDependency(operationId: string) {
    const dependencies = [...this.dependsOn];
    if (!dependencies.includes(operationId)) {
      dependencies.push(operationId);
      
      await this.update((operation) => {
        operation.dependsOnSerialized = JSON.stringify(dependencies);
      });
    }
  }

  /**
   * Elimina una dependencia
   */
  @writer async removeDependency(operationId: string) {
    const dependencies = this.dependsOn.filter(id => id !== operationId);
    
    await this.update((operation) => {
      operation.dependsOnSerialized = JSON.stringify(dependencies);
    });
  }

  /**
   * Reset para reintento
   */
  @writer async resetForRetry() {
    await this.update((operation) => {
      operation.status = 'pending';
      operation.errorMessage = '';
    });
  }

  // Métodos estáticos

  /**
   * Crea una nueva operación de sincronización
   */
  static async create(
    database: any,
    operationData: {
      operationType: 'create' | 'update' | 'delete';
      tableName: string;
      recordId: string;
      data: SyncOperationData;
      previousData?: SyncOperationData;
      userId: string;
      deviceId: string;
      priority?: number;
      requiresOnline?: boolean;
      canRollback?: boolean;
      autoRetry?: boolean;
      maxRetries?: number;
      dependsOn?: string[];
    }
  ) {
    const operation = await database.write(async () => {
      return database.get('sync_operations').create((operation: SyncOperation) => {
        // Información básica
        operation.operationId = SyncOperation.generateOperationId();
        operation.operationType = operationData.operationType;
        operation.tableName = operationData.tableName;
        operation.recordId = operationData.recordId;

        // Datos
        operation.dataSerialized = JSON.stringify(operationData.data);
        operation.previousDataSerialized = operationData.previousData 
          ? JSON.stringify(operationData.previousData) 
          : '';

        // Estado inicial
        operation.status = 'pending';
        operation.errorMessage = '';
        operation.retryCount = 0;
        operation.maxRetries = operationData.maxRetries || 3;

        // Metadatos
        operation.syncBatchId = '';
        operation.conflictResolutionSerialized = '';
        operation.serverTimestamp = 0;

        // Usuario y dispositivo
        operation.userId = operationData.userId;
        operation.deviceId = operationData.deviceId;

        // Prioridad y dependencias
        operation.priority = operationData.priority || 5;
        operation.dependsOnSerialized = JSON.stringify(operationData.dependsOn || []);

        // Flags
        operation.requiresOnline = operationData.requiresOnline !== false;
        operation.canRollback = operationData.canRollback !== false;
        operation.autoRetry = operationData.autoRetry !== false;
      });
    });

    return operation;
  }

  /**
   * Busca operaciones pendientes para un usuario
   */
  static async findPendingByUser(database: any, userId: string): Promise<SyncOperation[]> {
    const operations = await database.get('sync_operations').query().fetch();
    return operations
      .filter((op: SyncOperation) => op.userId === userId && op.isPending())
      .sort((a: SyncOperation, b: SyncOperation) => b.priority - a.priority);
  }

  /**
   * Busca operaciones listas para reintento
   */
  static async findReadyForRetry(database: any): Promise<SyncOperation[]> {
    const operations = await database.get('sync_operations').query().fetch();
    return operations.filter((op: SyncOperation) => op.isReadyForRetry());
  }

  /**
   * Limpia operaciones antiguas y sincronizadas
   */
  static async cleanup(database: any): Promise<number> {
    const operations = await database.get('sync_operations').query().fetch();
    let cleaned = 0;

    await database.write(async () => {
      for (const operation of operations) {
        if (operation.isSynced() && operation.isExpired()) {
          await operation.destroyPermanently();
          cleaned++;
        }
      }
    });

    return cleaned;
  }

  /**
   * Genera un ID único para la operación
   */
  private static generateOperationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `sync_${timestamp}_${random}`;
  }
}