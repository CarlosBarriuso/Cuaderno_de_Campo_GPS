.PHONY: all up down build rebuild logs frontend-bash backend-bash db-bash clean

# Nombre del archivo docker-compose.yml
COMPOSE_FILE = docker-compose.yaml

# Prefijo para los nombres de los servicios (opcional, Docker Compose usa el nombre del directorio por defecto)
# PROJECT_NAME = my_app_stack

all: up

# Levanta todos los servicios, construye las imágenes si es necesario
up:
	@echo "Levantando todos los servicios..."
	docker compose -f $(COMPOSE_FILE) up --build -d
	@echo "Servicios iniciados en segundo plano."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:8000"
	@echo "Adminer:  http://localhost:8080"

# Detiene y elimina todos los servicios, redes y volúmenes anónimos
down:
	@echo "Deteniendo y eliminando servicios..."
	docker compose -f $(COMPOSE_FILE) down

# Construye las imágenes sin iniciar los contenedores
build:
	@echo "Construyendo imágenes Docker..."
	docker compose -f $(COMPOSE_FILE) build

# Reconstruye y levanta los servicios (equivalente a down y up --build)
rebuild: down build up

# Muestra los logs de todos los servicios. Usa 'make logs SERVICE_NAME=frontend' para un servicio específico.
logs:
	@echo "Mostrando logs..."
ifdef SERVICE_NAME
	docker compose -f $(COMPOSE_FILE) logs -f $(SERVICE_NAME)
else
	docker compose -f $(COMPOSE_FILE) logs -f
endif

# Ejecuta un bash shell dentro del contenedor del frontend
frontend-bash:
	@echo "Abriendo shell en el contenedor 'frontend'..."
	docker compose -f $(COMPOSE_FILE) exec frontend bash

# Ejecuta un bash shell dentro del contenedor del backend
backend-bash:
	@echo "Abriendo shell en el contenedor 'backend'..."
	docker compose -f $(COMPOSE_FILE) exec backend bash

# Ejecuta un bash shell dentro del contenedor de la base de datos (puedes usar 'psql -U user mydatabase' una vez dentro)
db-bash:
	@echo "Abriendo shell en el contenedor 'db'..."
	docker compose -f $(COMPOSE_FILE) exec db bash

# Limpia: detiene, elimina contenedores, redes, volúmenes con nombre y imágenes
clean: down
	@echo "Eliminando volúmenes con nombre y imágenes..."
	docker compose -f $(COMPOSE_FILE) down --volumes --rmi all
	@echo "Limpieza completa."

help:
	@echo "Uso: make [comando]"
	@echo ""
	@echo "Comandos disponibles:"
	@echo "  up             : Levanta los servicios y construye las imágenes si es necesario (en modo detached)."
	@echo "  down           : Detiene y elimina los contenedores."
	@echo "  build          : Solo construye las imágenes Docker."
	@echo "  rebuild        : Detiene, construye y levanta los servicios."
	@echo "  logs           : Muestra los logs de todos los servicios (Ctrl+C para salir)."
	@echo "                   Uso: make logs SERVICE_NAME=<nombre_servicio> (ej: make logs SERVICE_NAME=frontend)"
	@echo "  frontend-bash  : Abre un shell bash en el contenedor del frontend."
	@echo "  backend-bash   : Abre un shell bash en el contenedor del backend."
	@echo "  db-bash        : Abre un shell bash en el contenedor de la base de datos."
	@echo "  clean          : Detiene, elimina contenedores, volúmenes persistentes y las imágenes."
	@echo "  help           : Muestra esta ayuda."
