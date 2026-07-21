# Migración a PostgreSQL con esquema dedicado — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar el Sistema de Control de Enfermería de MySQL 8.0 a PostgreSQL, conectándose a un Postgres existente en `192.168.1.49` mediante un esquema dedicado `historiaclinica`.

**Architecture:** Cambio schema-first con Prisma (`db push`, sin migraciones SQL). Se cambia el `provider` a `postgresql`, el esquema Postgres se aísla vía `?schema=historiaclinica` en la cadena de conexión, y `prisma db push` crea esquema + tablas al arrancar. Dev usa un contenedor Postgres local; el despliegue remoto (Portainer) usa el Postgres externo del `192.168.1.49`.

**Tech Stack:** Prisma ORM, PostgreSQL 16, Docker Compose, NestJS.

## Global Constraints

- Un solo `provider` de Prisma: `postgresql`. No queda ninguna referencia a MySQL en código/config (sí puede quedar en `docs/`).
- Esquema Postgres dedicado: `historiaclinica`.
- Cadena de conexión Postgres: `postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=historiaclinica`.
- Empezar limpio: sin migración de datos.
- `DB_NAME`/`DB_USER`/`DB_PASSWORD` del entorno remoto NO se queman en el repo (los define Omar en Portainer). `DB_HOST` sí lleva default `192.168.1.49`.
- Idioma: contenido de usuario en es_CO, código en inglés.

---

### Task 1: Cambiar el provider de Prisma a PostgreSQL

**Files:**
- Modify: `backend/prisma/schema.prisma:6`

**Interfaces:**
- Consumes: nada.
- Produces: `datasource db` con `provider = "postgresql"`. Los modelos y enums no cambian (portables).

- [ ] **Step 1: Editar el provider**

En `backend/prisma/schema.prisma`, cambiar la línea 6:

```prisma
// ANTES
  provider = "mysql"
// DESPUÉS
  provider = "postgresql"
```

Ningún otro cambio en el archivo: `@db.VarChar(n)`, `@db.Text`, `@db.Decimal(p,s)` y los `enum` son válidos tal cual en Postgres.

- [ ] **Step 2: Validar el esquema**

Run: `cd backend && npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀` (no requiere conexión a BD).

- [ ] **Step 3: Regenerar el cliente**

Run: `cd backend && npx prisma generate`
Expected: `Generated Prisma Client ...` sin errores.

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat(db): cambia provider de Prisma de mysql a postgresql"
```

---

### Task 2: Limpiar el Dockerfile del backend

**Files:**
- Modify: `backend/Dockerfile:21`

**Interfaces:**
- Consumes: nada.
- Produces: imagen del backend sin cliente MySQL; mantiene `openssl` (requerido por el engine de Prisma).

- [ ] **Step 1: Quitar `default-mysql-client`**

En `backend/Dockerfile`, cambiar la línea 21:

```dockerfile
# ANTES
RUN apt-get update -y && apt-get install -y openssl default-mysql-client && rm -rf /var/lib/apt/lists/*
# DESPUÉS
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
```

El `CMD` (`npx prisma db push --skip-generate && node dist/src/main.js`) no cambia.

- [ ] **Step 2: Verificar que la imagen construye**

Run: `docker build -t historiaclinica-backend:test ./backend`
Expected: build exitoso (`naming to docker.io/library/historiaclinica-backend:test`), sin errores de apt.

- [ ] **Step 3: Commit**

```bash
git add backend/Dockerfile
git commit -m "chore(docker): elimina default-mysql-client del backend"
```

---

### Task 3: Migrar el compose local y sus variables a Postgres (verificación end-to-end)

**Files:**
- Modify: `docker-compose.yml` (reemplazo completo del servicio `db` y el `DATABASE_URL` del backend)
- Modify: `.env.example`

**Interfaces:**
- Consumes: `provider = "postgresql"` (Task 1), Dockerfile limpio (Task 2).
- Produces: stack local Postgres funcional; el backend crea el esquema `historiaclinica` con todas las tablas y el seed genera el admin.

- [ ] **Step 1: Reemplazar `docker-compose.yml`**

Contenido completo nuevo:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: enfermeria-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    # Expuesto solo a localhost del host, no a toda la red.
    ports:
      - '127.0.0.1:${DB_PORT:-5432}:5432'
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER} -d ${DB_NAME}']
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: enfermeria-backend
    restart: unless-stopped
    ports:
      - '${BACKEND_PORT:-3001}:3001'
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}?schema=historiaclinica
      JWT_SECRET: ${JWT_SECRET}
      ADMIN_INITIAL_PASSWORD: ${ADMIN_INITIAL_PASSWORD:-admin}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:3000}
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 3001
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: enfermeria-frontend
    restart: unless-stopped
    ports:
      - '${FRONTEND_PORT:-3000}:3000'
    depends_on:
      - backend

volumes:
  db_data:
```

Nota: se elimina el env `REACT_APP_API_URL` del frontend (CRA lo hornea en build; en runtime no aplica). El frontend usa rutas relativas `/api` y nginx hace proxy a `backend:3001` también en local.

- [ ] **Step 2: Reemplazar `.env.example`**

Contenido completo nuevo:

```env
# Copie este archivo a `.env` y reemplace TODOS los valores por secretos propios.
# Nunca suba el archivo `.env` real al repositorio.

# --- PostgreSQL (contenedor local de desarrollo) ---
DB_NAME=enfermeria_db
DB_USER=enfermeria_user
DB_PASSWORD=cambie_este_password
DB_PORT=5432

# JWT_SECRET debe ser aleatorio y tener al menos 32 caracteres.
# Genere uno con: openssl rand -hex 32
JWT_SECRET=reemplace_por_un_secreto_aleatorio_de_32_o_mas_caracteres

# Contraseña inicial del usuario admin en el primer arranque (seed).
# Cámbiela tras el primer login desde /api/auth/change-password.
ADMIN_INITIAL_PASSWORD=cambie_esta_clave_admin

BACKEND_PORT=3001
FRONTEND_PORT=3000
FRONTEND_URL=http://localhost:3000
```

- [ ] **Step 3: Preparar `.env` de prueba y levantar el stack**

```bash
cp .env.example .env
docker compose up -d --build
```
Expected: los tres contenedores arrancan; `db` queda `healthy`.

- [ ] **Step 4: Verificar que el backend arrancó y creó el esquema**

Run: `docker compose logs backend | grep "Server running"`
Expected: `Server running on port 3001`.

Run: `docker compose exec -T db psql -U enfermeria_user -d enfermeria_db -c "\dt historiaclinica.*"`
Expected: lista con las tablas `users`, `roles`, `pacientes`, `controles`, `medicamentos`, `recetas`, `tratamientos`, `remisiones`, `audit_logs` en el esquema `historiaclinica`.

- [ ] **Step 5: Verificar login del admin (seed correcto en Postgres)**

Run:
```bash
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"cambie_esta_clave_admin"}'
```
Expected: respuesta JSON con un `access_token` (o `token`), status 200/201.

- [ ] **Step 6: Bajar el stack**

Run: `docker compose down`
Expected: contenedores detenidos y removidos.

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "feat(db): migra compose local y variables a PostgreSQL"
```

---

### Task 4: Migrar el compose remoto (Portainer) al Postgres externo

**Files:**
- Modify: `docker-compose.remote.yml` (eliminar servicio `db` y volumen `db_data`; apuntar el backend al Postgres externo)
- Modify: `.env.remote.example`

**Interfaces:**
- Consumes: imágenes `cieth/historiaclinica-backend` y `cieth/historiaclinica-frontend` (del flujo de build & push existente).
- Produces: stack de Portainer sin BD embebida; el backend se conecta a `${DB_HOST:-192.168.1.49}`.

- [ ] **Step 1: Reemplazar `docker-compose.remote.yml`**

Contenido completo nuevo:

```yaml
# docker-compose para despliegue REMOTO (Portainer) usando imagenes ya
# publicadas en Docker Hub. Construye y sube con:
#   .\scripts\build-and-push-dockerhub.ps1 v1.0.0
# Luego en Portainer: Stacks -> Add stack -> pega este archivo y define las
# variables de entorno (ver .env.remote.example).
#
# La base de datos es un PostgreSQL EXTERNO (192.168.1.49); no se levanta aqui.
# El frontend (nginx) hace proxy de /api al backend, por lo que el backend no
# se expone publicamente: solo el puerto del frontend es accesible.

services:
  backend:
    image: ${DOCKER_USERNAME:-cieth}/historiaclinica-backend:${IMAGE_TAG:-latest}
    container_name: enfermeria-backend
    restart: unless-stopped
    # Sin puertos publicados: el backend solo es accesible dentro de la red
    # interna, via el proxy /api de nginx en el frontend.
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST:-192.168.1.49}:${DB_PORT:-5432}/${DB_NAME}?schema=${DB_SCHEMA:-historiaclinica}
      JWT_SECRET: ${JWT_SECRET}
      ADMIN_INITIAL_PASSWORD: ${ADMIN_INITIAL_PASSWORD:-admin}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:8080}
    networks:
      - enfermeria-net

  frontend:
    image: ${DOCKER_USERNAME:-cieth}/historiaclinica-frontend:${IMAGE_TAG:-latest}
    container_name: enfermeria-frontend
    restart: unless-stopped
    ports:
      - '${FRONTEND_PORT:-8080}:3000'
    depends_on:
      - backend
    networks:
      - enfermeria-net

networks:
  enfermeria-net:
    driver: bridge
```

- [ ] **Step 2: Reemplazar `.env.remote.example`**

Contenido completo nuevo:

```env
# Variables de entorno para el despliegue REMOTO (docker-compose.remote.yml).
# En Portainer se pegan en la seccion "Environment variables" del Stack.
# NO subas el .env real al repositorio.

# --- Imagenes en Docker Hub ---
DOCKER_USERNAME=cieth
IMAGE_TAG=latest

# --- PostgreSQL EXTERNO (192.168.1.49) ---
# DB_NAME, DB_USER y DB_PASSWORD los defines en Portainer (no van en el repo).
DB_HOST=192.168.1.49
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_SCHEMA=historiaclinica

# --- Seguridad ---
# JWT_SECRET aleatorio de >=32 caracteres. Genera uno con: openssl rand -hex 32
JWT_SECRET=reemplace_por_un_secreto_aleatorio_de_32_o_mas_caracteres
# Password inicial del admin en el primer arranque (cambiar tras el primer login).
ADMIN_INITIAL_PASSWORD=cambie_esta_clave_admin

# --- Red / acceso ---
# Puerto publico del frontend (host). El backend NO se expone.
FRONTEND_PORT=8080
# URL publica del frontend (para CORS del backend).
FRONTEND_URL=http://localhost:8080
```

- [ ] **Step 3: Validar la estructura del compose remoto**

Run: `docker compose -f docker-compose.remote.yml --env-file .env.remote.example config`
Expected: parsea sin error; el `DATABASE_URL` resuelto muestra `postgresql://...@192.168.1.49:5432/...?schema=historiaclinica`; NO aparece el servicio `db` ni el volumen `db_data`.

- [ ] **Step 4: Commit**

```bash
git add docker-compose.remote.yml .env.remote.example
git commit -m "feat(deploy): apunta el stack remoto al PostgreSQL externo 192.168.1.49"
```

---

### Task 5: Actualizar documentación y limpiar referencias a MySQL

**Files:**
- Modify: `README.md:11`, `README.md:95`, `README.md:117-121`
- Modify: `scripts/build-and-push-dockerhub.ps1:178`

**Interfaces:**
- Consumes: todos los cambios anteriores.
- Produces: documentación coherente; sin referencias a MySQL fuera de `docs/`.

- [ ] **Step 1: Actualizar la tabla de stack (README línea 11)**

```markdown
// ANTES
| **Base de datos** | MySQL 8.0 |
// DESPUÉS
| **Base de datos** | PostgreSQL 16 |
```

- [ ] **Step 2: Actualizar la tabla de servicios (README línea 95)**

```markdown
// ANTES
| MySQL | localhost:3306 |
// DESPUÉS
| PostgreSQL | localhost:5432 |
```

- [ ] **Step 3: Actualizar el bloque de variables (README líneas 117-121)**

```env
// ANTES
DB_ROOT_PASSWORD=cambie_este_password_root
DB_NAME=enfermeria_db
DB_USER=enfermeria_user
DB_PASSWORD=cambie_este_password
DB_PORT=3306
// DESPUÉS
DB_NAME=enfermeria_db
DB_USER=enfermeria_user
DB_PASSWORD=cambie_este_password
DB_PORT=5432
```

- [ ] **Step 4: Actualizar la pista del script de build (línea 178)**

En `scripts/build-and-push-dockerhub.ps1`:

```powershell
# ANTES
Write-Host "      DB_ROOT_PASSWORD, DB_PASSWORD, JWT_SECRET, ADMIN_INITIAL_PASSWORD..."
# DESPUÉS
Write-Host "      DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET, ADMIN_INITIAL_PASSWORD..."
```

- [ ] **Step 5: Verificar que no quedan referencias a MySQL en código/config**

Run: `grep -rniE "mysql|3306|DB_ROOT_PASSWORD|MYSQL" --exclude-dir=node_modules --exclude-dir=docs --exclude-dir=.git .`
Expected: sin resultados (las únicas menciones a MySQL quedan en `docs/`, que documentan la migración).

- [ ] **Step 6: Commit**

```bash
git add README.md scripts/build-and-push-dockerhub.ps1
git commit -m "docs: actualiza referencias de MySQL a PostgreSQL"
```

---

## Self-Review

**Spec coverage:**
- Sección 1 (schema.prisma) → Task 1. ✓
- Sección 2 (cadena de conexión + esquema) → Tasks 3 y 4 (DATABASE_URL con `?schema=historiaclinica`). ✓
- Sección 3 (Dockerfile) → Task 2. ✓
- Sección 4 (compose local) → Task 3. ✓
- Sección 5 (compose remoto) → Task 4. ✓
- Sección 6 (variables de entorno) → Tasks 3 (`.env.example`) y 4 (`.env.remote.example`). ✓
- Criterios de éxito (esquema creado, seed, login, sin restos de MySQL) → Tasks 3 (steps 4-5) y 5 (step 5). ✓
- Riesgo de ruteo a 192.168.1.49 → se valida en el primer despliegue real (fuera del alcance de este plan local); documentado en el spec.

**Placeholder scan:** sin TBD/TODO; todos los steps tienen contenido/comandos concretos. ✓

**Type/nombre consistency:** nombres de servicios (`db`, `backend`, `frontend`), esquema (`historiaclinica`), variables (`DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD/DB_SCHEMA`) y formato de `DATABASE_URL` son consistentes entre Tasks 3 y 4. ✓
