# 🚀 Aplicación Full-Stack Dockerizada

Este proyecto proporciona un entorno de desarrollo completo para una aplicación full-stack, integrando un **frontend Next.js**, un **backend FastAPI**, una base de datos **PostgreSQL**, y **Adminer** para la gestión de la base de datos, todo orquestado eficientemente con **Docker Compose**.

-----

## 💡 Tecnologías Utilizadas

  * **Frontend**: 
    - [Next.js 15.3](https://nextjs.org/) con App Router
    - [React 19](https://reactjs.org/)
    - [Tailwind CSS](https://tailwindcss.com/) con [@tailwindcss/postcss](https://tailwindcss.com/docs/installation/using-postcss)
    - [lucide-react](https://lucide.dev/) para iconos
    - Utilidades: [class-variance-authority](https://cva.style/), [clsx](https://www.npmjs.com/package/clsx), [tailwind-merge](https://www.npmjs.com/package/tailwind-merge)
  
  * **Backend**: 
    - [FastAPI](https://fastapi.tiangolo.com/) con Python 3.10+
    - SQLAlchemy como ORM
    - Alembic para migraciones
    
  * **Base de Datos**: [PostgreSQL 16](https://www.postgresql.org/)
  * **Gestión de DB**: [Adminer](https://www.adminer.org/)
  * **Contenedores**: [Docker](https://www.docker.com/) y [Docker Compose](https://docs.docker.com/compose/)
  * **Automatización**: [GNU Make](https://www.gnu.org/software/make/)

-----

## 📋 Requisitos Previos

Antes de configurar el proyecto, asegúrate de tener instaladas las siguientes herramientas en tu sistema:

  * **Docker Desktop**: Incluye Docker Engine y Docker Compose.
      * [Descarga Docker Desktop](https://www.docker.com/products/docker-desktop)
  * **GNU Make**:
      * **Linux**: Suele estar preinstalado o disponible a través del gestor de paquetes (ej. `sudo apt install make`).
      * **macOS**: Parte de las Xcode Command Line Tools (`xcode-select --install`).
      * **Windows**: Se recomienda usar [WSL (Windows Subsystem for Linux)](https://docs.microsoft.com/en-us/windows/wsl/install) o instalar Make manualmente.

-----

## 🏗 Estructura del Proyecto

```
dbcopy/
├── docker-compose.yaml     # Configuración de todos los servicios
├── Makefile                # Comandos de automatización
│
├── backend/               # Aplicación FastAPI
│   ├── app/               # Código fuente de la aplicación
│   │   ├── __init__.py
│   │   └── main.py        # Punto de entrada de FastAPI
│   ├── Dockerfile         # Configuración de Docker
│   ├── requirements.txt   # Dependencias de Python
│   └── .env.example      # Variables de entorno de ejemplo
│
└── frontend/             # Aplicación Next.js
    ├── src/               # Código fuente
    ├── public/            # Archivos estáticos
    ├── Dockerfile         # Configuración de Docker
    ├── next.config.js     # Configuración de Next.js
    └── .env.example      # Variables de entorno de ejemplo
```

## 🚀 Inicio Rápido

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/ismaelcd-projects/dbcopy.git
   cd dbcopy
   ```

2. **Configurar variables de entorno**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env.local
   ```

3. **Iniciar la aplicación**
   ```bash
   # Usando Docker Compose (recomendado)
   docker-compose up --build
   
   # O usando Make
   make up
   ```

4. **Acceder a las aplicaciones**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Adminer (DB GUI): http://localhost:8080
     - Sistema: PostgreSQL
     - Servidor: db
     - Usuario: postgres
     - Contraseña: postgres
     - Base de datos: dbcopy

-----

## 🚀 Puesta en Marcha

Sigue estos pasos para levantar la aplicación en tu entorno local:

1.  **Clonar el Repositorio**:

    ```bash
    git clone <url-de-tu-repositorio>
    cd mi-aplicacion-fullstack # O el nombre de tu directorio raíz
    ```

2.  **Iniciar los Servicios Docker**:
    Desde la raíz del proyecto (donde se encuentra `docker-compose.yml` y `Makefile`), ejecuta el siguiente comando:

    ```bash
    make up
    ```

    Este comando se encargará de:

      * Construir las imágenes Docker de tu frontend y backend.
      * Crear y arrancar los contenedores para `frontend`, `backend`, `db` (PostgreSQL) y `adminer`.
      * Mostrará las URLs donde puedes acceder a los servicios.

-----

## 🌐 Acceso a los Servicios

Una vez que todos los servicios estén en funcionamiento (puedes verificar su estado con `make logs`), podrás acceder a ellos a través de las siguientes URLs:

  * **Frontend (Next.js)**: [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)
  * **Backend (FastAPI)**: [http://localhost:8000](https://www.google.com/search?q=http://localhost:8000)
  * **Adminer (Gestor de Base de Datos)**: [http://localhost:8080](https://www.google.com/search?q=http://localhost:8080)

-----

## 🗄️ Conexión a la Base de Datos con Adminer

Para conectarte a tu base de datos PostgreSQL usando Adminer:

1.  Abre tu navegador y ve a [http://localhost:8080](https://www.google.com/search?q=http://localhost:8080).
2.  Ingresa los siguientes detalles en el formulario de login:
      * **Sistema**: `PostgreSQL`
      * **Servidor**: `db` (Este es el nombre del servicio de base de datos en `docker-compose.yml`)
      * **Nombre de usuario**: `user` (O el valor que hayas configurado para `POSTGRES_USER`)
      * **Contraseña**: `password` (O el valor que hayas configurado para `POSTGRES_PASSWORD`)
      * **Base de datos**: `mydatabase` (O el valor que hayas configurado para `POSTGRES_DB`)
3.  Haz clic en "Login" para acceder a la interfaz de Adminer.

**Nota Importante**: Para entornos de producción, es crucial utilizar credenciales de base de datos robustas y considerar no exponer Adminer públicamente.

-----

## 🛠 Comandos Útiles

### Comandos de Docker Compose

```bash
# Iniciar todos los servicios
docker-compose up

# Reconstruir e iniciar
docker-compose up --build

# Detener todos los contenedores
docker-compose down

# Ver logs
docker-compose logs -f

# Ejecutar comandos en un contenedor
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Comandos de Desarrollo Frontend

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo con Turbopack
npm run dev

# Construir para producción
npm run build

# Iniciar servidor de producción
npm start

# Ejecutar linter
npm run lint
```

### Comandos de Make (opcional)

```bash
# Iniciar la aplicación
make up

# Detener la aplicación
make down

# Reconstruir las imágenes
make build

# Ver logs
make logs
```

## 🔧 Desarrollo

### Configuración del Entorno

1. **Variables de Entorno**
   - Actualiza los archivos `.env` según sea necesario
   - No olvides configurar las credenciales de producción en entornos reales

2. **Base de Datos**
   - Las migraciones se manejan con Alembic
   - Para crear una nueva migración:
     ```bash
     docker-compose exec backend alembic revision --autogenerate -m "descripción del cambio"
     docker-compose exec backend alembic upgrade head
     ```

## 🚀 Despliegue en Producción

1. Actualiza las variables de entorno para producción
2. Revisa la configuración de CORS en el backend
3. Configura HTTPS usando un proxy inverso como Nginx
4. Considera usar un servicio de orquestación como Kubernetes para entornos de producción

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Haz un Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Haz push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## ✉️ Contacto

Tu Nombre - [@tu_twitter](https://twitter.com/tu_twitter) - tu.email@ejemplo.com

Enlace del Proyecto: [https://github.com/ismaelcd-projects/dbcopy](https://github.com/ismaelcd-projects/dbcopy)

## 🙏 Agradecimientos

- A todos los contribuyentes que han ayudado a mejorar este proyecto
- A las comunidades de código abierto que hacen posible estas tecnologías

---

<div align="center">
  Hecho con ❤️ por el equipo de DBCopy
</div>

El `Makefile` te proporciona una serie de atajos para interactuar con tus contenedores Docker:

  * `make up`: Inicia todos los servicios, construyendo las imágenes si es necesario.
  * `make down`: Detiene y elimina los contenedores de los servicios.
  * `make build`: Solo construye las imágenes Docker de los servicios.
  * `make rebuild`: Detiene los servicios, reconstruye las imágenes y los vuelve a iniciar. Útil tras cambios en Dockerfiles.
  * `make logs`: Muestra los logs en tiempo real de todos los servicios.
      * `make logs SERVICE_NAME=<nombre_servicio>`: Para ver los logs de un servicio específico (ej. `frontend`, `backend`, `db`).
  * `make frontend-bash`: Abre una terminal bash dentro del contenedor del frontend.
  * `make backend-bash`: Abre una terminal bash dentro del contenedor del backend.
  * `make db-bash`: Abre una terminal bash dentro del contenedor de la base de datos.
  * `make clean`: **¡Advertencia\!** Detiene todos los servicios, elimina contenedores, redes, **volúmenes persistentes** y las imágenes Docker. Esto borrará permanentemente tus datos de la base de datos.
  * `make help`: Muestra una descripción de todos los comandos disponibles.

-----

## 🛑 Detener los Servicios

Para detener todos los servicios en ejecución cuando hayas terminado de trabajar:

```bash
make down
```

Este comando detendrá y eliminará los contenedores, pero conservará el volumen de datos de tu base de datos, permitiendo que tus datos persistan para futuras sesiones.

-----

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Siéntete libre de hacer un fork del repositorio, implementar mejoras y enviar pull requests.

-----

## 📄 Licencia

Este proyecto se distribuye bajo la [Licencia MIT](https://www.google.com/search?q=LICENSE). (Si aún no tienes un archivo `LICENSE`, considera crearlo en la raíz de tu proyecto).

-----
# Cuaderno_de_Campo_GPS
