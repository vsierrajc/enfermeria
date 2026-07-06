# Sistema de Control de Enfermería

Sistema web completo para la gestión y control de enfermería en entornos hospitalarios y clínicos. Permite administrar pacientes, registros de signos vitales (controles), recetas médicas, medicamentos, remisiones externas y estadísticas operativas.

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | React 18, TypeScript, React Router v6, Chart.js |
| **Backend** | NestJS, Prisma ORM, class-validator, Swagger |
| **Base de datos** | MySQL 8.0 |
| **Infraestructura** | Docker Compose (3 servicios) |

## Funcionalidades

### Módulos principales

- **Pacientes** — CRUD completo con datos personales, alergias, contacto de emergencia e historia clínica consolidada.
- **Controles** — Registro de signos vitales (presión arterial, temperatura, pulso, saturación de O₂, peso, talla) con clasificación por tipo (rutinario, urgente, seguimiento, ingreso, periódico).
- **Recetas** — Asociación de medicamentos a pacientes con dosis, frecuencia, duración, fechas y médico prescriptor.
- **Medicamentos** — Catálogo con presentación, unidad, stock y stock mínimo.
- **Remisiones** — Derivaciones externas con tipo (especialista, EPS, incapacidad, examen externo, otro), destino, diagnóstico y seguimiento de estado (pendiente → en curso → finalizado).
- **Estadísticas** — Dashboard con resumen de totales, controles por mes, presión promedio, controles por tipo y remisiones por estado.

### Reportes PDF

Generación de reportes en PDF para:
- Listado general de pacientes
- Historia clínica completa del paciente (datos personales + controles + recetas + remisiones)
- Listado de controles
- Listado de remisiones

### Autenticación y roles

Sistema de autenticación JWT con tres roles:

| Rol | Permisos |
|-----|----------|
| **ADMINISTRADOR** | Acceso total a todos los módulos |
| **ENFERMERA** | Crear/eliminar controles, recetas y remisiones |
| **CONSULTA** | Solo lectura |

## Estructura del proyecto

```
enfermeria-v2/
├── backend/                    # API REST NestJS
│   ├── src/
│   │   ├── auth/               # Login, JWT, guards
│   │   ├── empleados/          # Pacientes y enfermeras
│   │   ├── controles/          # Signos vitales
│   │   ├── recetas/            # Prescripciones médicas
│   │   ├── medicamentos/       # Catálogo de medicamentos
│   │   ├── remisiones/         # Derivaciones externas
│   │   ├── estadisticas/       # Dashboard y métricas
│   │   ├── common/             # Filtros, interceptores, decoradores
│   │   └── main.ts             # Bootstrap + seed automático
│   ├── prisma/
│   │   └── schema.prisma       # Modelo de datos
│   └── Dockerfile
├── frontend/                   # Aplicación React
│   ├── src/
│   │   ├── pages/              # Vistas de la aplicación
│   │   ├── api/                # Servicios HTTP (axios)
│   │   ├── hooks/              # Contexto de autenticación
│   │   ├── components/         # Componentes reutilizables
│   │   ├── types/              # Definiciones TypeScript
│   │   └── utils/pdf.ts        # Generación de reportes PDF
│   └── Dockerfile
├── docker-compose.yml          # Orquestación de servicios
└── .env                        # Variables de entorno
```

## Instalación y ejecución

### Requisitos

- Docker y Docker Compose v2

### Iniciar el sistema

```bash
git clone https://github.com/tu-usuario/enfermeria-v2.git
cd enfermeria-v2
docker compose up -d --build
```

Los servicios quedan disponibles en:

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/api/docs |
| MySQL | localhost:3306 |

### Credenciales iniciales

En el primer arranque se crea **solo** el usuario administrador. Su contraseña se toma
de `ADMIN_INITIAL_PASSWORD` (por defecto `admin` si no se define, con una advertencia en el log).

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `$ADMIN_INITIAL_PASSWORD` | ADMINISTRADOR |

> **Cambie la contraseña del admin inmediatamente** tras el primer login con
> `POST /api/auth/change-password`.
>
> Los usuarios de demostración (`enfermera1`, `enfermera2`, `auditor`) y los datos
> de ejemplo **solo se crean cuando `NODE_ENV` ≠ `production`**.

### Variables de entorno

Archivo `.env`:

```env
DB_ROOT_PASSWORD=cambie_este_password_root
DB_NAME=enfermeria_db
DB_USER=enfermeria_user
DB_PASSWORD=cambie_este_password
DB_PORT=3306

# Aleatorio y con 32+ caracteres. Genérelo con: openssl rand -hex 32
JWT_SECRET=reemplace_por_un_secreto_aleatorio_de_32_o_mas_caracteres

# Contraseña inicial del admin (cámbiela tras el primer login)
ADMIN_INITIAL_PASSWORD=cambie_esta_clave_admin

FRONTEND_URL=http://localhost:3000
BACKEND_PORT=3001
FRONTEND_PORT=3000
```

> El backend **no arranca** si `JWT_SECRET` tiene menos de 32 caracteres.

## API REST

La documentación interactiva de la API está disponible en Swagger:

```
http://localhost:3001/api/docs
```

### Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Iniciar sesión |
| `GET` | `/api/pacientes` | Listar pacientes |
| `POST` | `/api/pacientes` | Crear paciente |
| `GET` | `/api/controles` | Listar controles |
| `POST` | `/api/controles` | Registrar control |
| `GET` | `/api/recetas` | Listar recetas |
| `POST` | `/api/recetas` | Crear receta |
| `GET` | `/api/remisiones` | Listar remisiones |
| `POST` | `/api/remisiones` | Crear remisión |
| `GET` | `/api/estadisticas/resumen` | Resumen general |
| `GET` | `/api/medicamentos` | Listar medicamentos |

## Modelo de datos

```
RoleEntity ─── User (enfermera, admin, consulta)
                 │
                 ├── Paciente ─── Control ─── Receta
                 │                   │          └── Medicamento
                 │                   └── Tratamiento
                 └── Remision ──── Medicamento
```

## Licencia

MIT
