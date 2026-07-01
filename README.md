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

### Credenciales por defecto

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin` | ADMINISTRADOR |
| `enfermera1` | `password` | ENFERMERA |
| `auditor` | `password` | CONSULTA |

> Los datos se.seedean automáticamente al iniciar por primera vez.

### Variables de entorno

Archivo `.env`:

```env
DB_ROOT_PASSWORD=root_password
DB_NAME=enfermeria_db
DB_USER=enfermera_user
DB_PASSWORD=enfermera_password
DB_PORT=3306
JWT_SECRET=supersecretjwtkey2024
BACKEND_PORT=3001
FRONTEND_PORT=3000
```

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
