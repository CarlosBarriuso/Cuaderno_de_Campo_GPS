#!/bin/bash

# Script para iniciar el entorno de desarrollo con Docker Compose
# Cuaderno de Campo GPS - FastAPI + Next.js

echo "🚀 Iniciando Cuaderno de Campo GPS - Entorno de Desarrollo"
echo "=================================================="

# Detener servicios existentes
echo "🔄 Deteniendo servicios existentes..."
docker-compose -f docker-compose.fastapi.yml down

# Limpiar contenedores huérfanos
echo "🧹 Limpiando contenedores huérfanos..."
docker-compose -f docker-compose.fastapi.yml down --remove-orphans

# Construir imágenes
echo "🏗️ Construyendo imágenes..."
docker-compose -f docker-compose.fastapi.yml build

# Iniciar servicios
echo "🚀 Iniciando servicios..."
docker-compose -f docker-compose.fastapi.yml up -d

# Mostrar estado de los servicios
echo "📊 Estado de los servicios:"
docker-compose -f docker-compose.fastapi.yml ps

# Mostrar logs en tiempo real
echo "📝 Mostrando logs (Ctrl+C para salir)..."
echo "=================================================="
docker-compose -f docker-compose.fastapi.yml logs -f