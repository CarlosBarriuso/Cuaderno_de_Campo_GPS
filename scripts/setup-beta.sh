#!/bin/bash

# Script de Setup para Beta Testing - Cuaderno de Campo GPS
# Fecha: 14 Julio 2025

echo "🌾 Configurando entorno Beta Testing - Cuaderno de Campo GPS"
echo "=================================================="

# Crear directorio logs si no existe
mkdir -p logs

# Copiar configuración beta
if [ -f ".env.beta" ]; then
    cp .env.beta .env
    echo "✅ Configuración beta aplicada"
else
    echo "❌ Archivo .env.beta no encontrado"
    exit 1
fi

# Setup base de datos beta
echo "📊 Configurando base de datos beta..."
cd apps/backend

# Generar Prisma client
npm run db:generate

# Aplicar migraciones
npm run db:migrate:deploy

# Insertar datos semilla para beta
npm run db:seed

echo "✅ Base de datos beta configurada"

# Volver al directorio raíz
cd ../..

# Verificar servicios requeridos
echo "🔧 Verificando servicios..."

# PostgreSQL
if ! pg_isready -h localhost -p 5434 > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL no está corriendo en puerto 5434"
    echo "   Ejecutar: docker-compose up -d postgres"
fi

# Redis
if ! redis-cli -p 6379 ping > /dev/null 2>&1; then
    echo "⚠️  Redis no está corriendo en puerto 6379"
    echo "   Ejecutar: docker-compose up -d redis"
fi

# Crear usuarios beta de prueba
echo "👥 Configurando usuarios beta de prueba..."

# Crear archivo con datos de prueba
cat > beta-users.json << 'EOF'
{
  "beta_users": [
    {
      "email": "agricultor1@beta.test",
      "name": "Juan García",
      "region": "Andalucía",
      "cultivo": "Olivar",
      "hectareas": 45
    },
    {
      "email": "cooperativa1@beta.test", 
      "name": "Cooperativa Cereales Norte",
      "region": "Castilla y León",
      "cultivo": "Cereales",
      "hectareas": 1200
    },
    {
      "email": "tecnico1@beta.test",
      "name": "María Rodríguez - ATRIA",
      "region": "Valencia",
      "cultivo": "Cítricos",
      "hectareas": 0
    }
  ]
}
EOF

echo "✅ Usuarios beta de prueba creados en beta-users.json"

# Configurar métricas beta
echo "📈 Configurando sistema de métricas beta..."

# Crear directorio para métricas
mkdir -p metrics/beta

# Crear archivo de configuración de métricas
cat > metrics/beta/config.json << 'EOF'
{
  "beta_metrics": {
    "user_adoption": {
      "onboarding_completion": true,
      "first_parcela_created": true,
      "first_activity_recorded": true,
      "weekly_active_users": true
    },
    "feature_usage": {
      "sigpac_validation": true,
      "gps_recording": true,
      "weather_integration": true,
      "ocr_usage": true,
      "offline_sync": true
    },
    "satisfaction": {
      "nps_score": true,
      "support_tickets": true,
      "session_duration": true,
      "feature_ratings": true
    },
    "commercial": {
      "pricing_acceptance": true,
      "conversion_intent": true,
      "referral_likelihood": true
    }
  },
  "reporting": {
    "daily_summary": true,
    "weekly_detailed": true,
    "real_time_dashboard": true
  }
}
EOF

echo "✅ Sistema de métricas beta configurado"

# Configurar sistema de feedback
echo "💬 Configurando sistema de feedback..."

mkdir -p feedback/beta

cat > feedback/beta/channels.json << 'EOF'
{
  "feedback_channels": {
    "in_app": {
      "quick_feedback": true,
      "bug_reporting": true,
      "feature_requests": true
    },
    "surveys": {
      "weekly_nps": true,
      "feature_specific": true,
      "final_evaluation": true
    },
    "interviews": {
      "phone_checkins": true,
      "video_interviews": true,
      "focus_groups": true
    },
    "community": {
      "whatsapp_group": true,
      "telegram_channel": true,
      "email_updates": true
    }
  },
  "response_sla": {
    "critical_bugs": "2 hours",
    "general_support": "24 hours",
    "feature_feedback": "72 hours"
  }
}
EOF

echo "✅ Sistema de feedback configurado"

# Generar certificados SSL locales para beta
echo "🔒 Generando certificados SSL para beta.localhost..."

mkdir -p ssl
if command -v openssl > /dev/null 2>&1; then
    openssl req -x509 -newkey rsa:4096 -keyout ssl/beta-key.pem -out ssl/beta-cert.pem -days 365 -nodes -subj "/CN=beta.localhost"
    echo "✅ Certificados SSL generados"
else
    echo "⚠️  OpenSSL no encontrado, usando HTTP para beta"
fi

# Crear script de inicio para beta
cat > start-beta.sh << 'EOF'
#!/bin/bash

echo "🚀 Iniciando entorno Beta Testing..."

# Terminal 1: Backend API
gnome-terminal --title="Beta Backend" -- bash -c "cd apps/backend && npm run dev; exec bash"

# Terminal 2: Frontend Web  
gnome-terminal --title="Beta Frontend" -- bash -c "cd apps/web && npm run dev; exec bash"

# Terminal 3: Monitoring
gnome-terminal --title="Beta Monitoring" -- bash -c "echo 'Beta Monitoring Dashboard'; tail -f logs/beta.log; exec bash"

echo "✅ Entorno beta iniciado en 3 terminales"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 API: http://localhost:3007"
echo "📊 Logs: tail -f logs/beta.log"
EOF

chmod +x start-beta.sh

echo ""
echo "🎉 ¡Entorno Beta Testing configurado exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Ejecutar: ./start-beta.sh"
echo "2. Abrir navegador en: http://localhost:3000"
echo "3. Verificar API en: http://localhost:3007/health"
echo "4. Revisar logs en: logs/beta.log"
echo ""
echo "📧 Contacto beta: beta@cuadernodecampo.es"
echo "📱 WhatsApp soporte: +34 XXX XXX XXX"
echo ""
echo "✅ Ready para reclutamiento de 50 agricultores beta!"