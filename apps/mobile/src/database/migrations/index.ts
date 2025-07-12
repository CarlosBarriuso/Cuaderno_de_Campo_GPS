// migrations/index.ts - Migraciones de la base de datos WatermelonDB
import { schemaMigrations, Migration } from '@nozbe/watermelondb/Schema/migrations';

const migrations = schemaMigrations({
  migrations: [
    // Migración inicial v1
    // No necesita migración porque es la versión inicial
  ],
});

export default migrations;