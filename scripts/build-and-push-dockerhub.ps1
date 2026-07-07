# Script PowerShell para construir y subir imágenes a Docker Hub
# Sistema de Historia Clínica / Control de Enfermería
# Uso: .\scripts\build-and-push-dockerhub.ps1 [version] [-ApiUrl <url>]
# Ejemplos:
#   .\scripts\build-and-push-dockerhub.ps1 v1.0.0
#   .\scripts\build-and-push-dockerhub.ps1 v1.0.0 -ApiUrl https://api.midominio.com
#
# Ejecutar SIEMPRE desde la raíz del repo (donde están backend/ y frontend/).

param(
    [string]$Version = "latest",
    # URL de la API horneada en el build del frontend (CRA).
    # Vacío (por defecto) => el frontend usa rutas relativas (/api) y nginx
    # hace proxy al backend. Solo cámbialo si el backend vive en otro origen.
    [string]$ApiUrl = ""
)

# Configuración - CAMBIAR ESTOS VALORES SI CORRESPONDE
$DOCKER_USERNAME = "cieth"  # Usuario de Docker Hub
$BACKEND_IMAGE  = "$DOCKER_USERNAME/historiaclinica-backend"
$FRONTEND_IMAGE = "$DOCKER_USERNAME/historiaclinica-frontend"
$BUILD_DATE = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Obtener commit de Git
try {
    $GIT_COMMIT = (git rev-parse --short HEAD 2>$null)
    if ($LASTEXITCODE -ne 0) { $GIT_COMMIT = "unknown" }
} catch {
    $GIT_COMMIT = "unknown"
}

# --- Helpers de salida ---------------------------------------------------
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}
function Handle-Error {
    param([string]$Message)
    Write-ColorOutput "[X] Error: $Message" "Red"
    exit 1
}
function Show-Progress { param([string]$Message) Write-ColorOutput "[~] $Message" "Blue" }
function Show-Success  { param([string]$Message) Write-ColorOutput "[OK] $Message" "Green" }

# --- Banner --------------------------------------------------------------
Write-ColorOutput "Construyendo y subiendo imagenes a Docker Hub..." "Green"
Write-ColorOutput "  Version:    $Version" "Yellow"
Write-ColorOutput "  Usuario:    $DOCKER_USERNAME" "Yellow"
Write-ColorOutput "  Fecha:      $BUILD_DATE" "Yellow"
Write-ColorOutput "  Commit:     $GIT_COMMIT" "Yellow"
if ([string]::IsNullOrEmpty($ApiUrl)) {
    Write-ColorOutput "  API URL:    (relativa /api via proxy nginx)" "Yellow"
} else {
    Write-ColorOutput "  API URL:    $ApiUrl" "Yellow"
}
Write-Host ""

# --- Verificaciones previas ---------------------------------------------
Show-Progress "Verificando requisitos previos..."

try {
    docker info | Out-Null
    if ($LASTEXITCODE -ne 0) { Handle-Error "Docker no esta corriendo. Inicia Docker Desktop." }
} catch {
    Handle-Error "Docker no esta corriendo. Inicia Docker Desktop."
}

$dockerInfo = docker info 2>$null
if (-not ($dockerInfo -match "Username")) {
    Write-ColorOutput "No estas autenticado en Docker Hub" "Yellow"
    Write-ColorOutput "Ejecutando 'docker login'..." "Cyan"
    docker login
    if ($LASTEXITCODE -ne 0) { Handle-Error "Fallo la autenticacion en Docker Hub" }
}

if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Handle-Error "No se encontraron 'backend' y 'frontend'. Ejecuta el script desde la raiz del repo."
}

Show-Success "Verificaciones completadas"
Write-Host ""

# --- Build backend -------------------------------------------------------
Show-Progress "Construyendo imagen del backend..."
Set-Location "backend"
if ($LASTEXITCODE -ne 0) { Handle-Error "No se pudo acceder al directorio del backend" }

$buildArgs = @(
    "--build-arg", "BUILD_DATE=$BUILD_DATE",
    "--build-arg", "VCS_REF=$GIT_COMMIT",
    "--build-arg", "VERSION=$Version",
    "--label", "org.opencontainers.image.created=$BUILD_DATE",
    "--label", "org.opencontainers.image.version=$Version",
    "--label", "org.opencontainers.image.revision=$GIT_COMMIT",
    "--label", "org.opencontainers.image.title=Historia Clinica Backend",
    "--label", "org.opencontainers.image.description=NestJS + Prisma backend (control de enfermeria)",
    "--label", "org.opencontainers.image.vendor=OAVA Solutions",
    "-f", "Dockerfile",
    "-t", "$($BACKEND_IMAGE):$Version",
    "."
)
docker build @buildArgs
if ($LASTEXITCODE -ne 0) { Handle-Error "Fallo la construccion del backend" }
if ($Version -ne "latest") { docker tag "$($BACKEND_IMAGE):$Version" "$($BACKEND_IMAGE):latest" }

Set-Location ".."
Show-Success "Backend construido exitosamente"

# --- Build frontend ------------------------------------------------------
Show-Progress "Construyendo imagen del frontend..."
Set-Location "frontend"
if ($LASTEXITCODE -ne 0) { Handle-Error "No se pudo acceder al directorio del frontend" }

$buildArgs = @(
    "--build-arg", "BUILD_DATE=$BUILD_DATE",
    "--build-arg", "VCS_REF=$GIT_COMMIT",
    "--build-arg", "VERSION=$Version",
    "--build-arg", "REACT_APP_API_URL=$ApiUrl",
    "--label", "org.opencontainers.image.created=$BUILD_DATE",
    "--label", "org.opencontainers.image.version=$Version",
    "--label", "org.opencontainers.image.revision=$GIT_COMMIT",
    "--label", "org.opencontainers.image.title=Historia Clinica Frontend",
    "--label", "org.opencontainers.image.description=React (CRA) + nginx (control de enfermeria)",
    "--label", "org.opencontainers.image.vendor=OAVA Solutions",
    "-f", "Dockerfile",
    "-t", "$($FRONTEND_IMAGE):$Version",
    "."
)
docker build @buildArgs
if ($LASTEXITCODE -ne 0) { Handle-Error "Fallo la construccion del frontend" }
if ($Version -ne "latest") { docker tag "$($FRONTEND_IMAGE):$Version" "$($FRONTEND_IMAGE):latest" }

Set-Location ".."
Show-Success "Frontend construido exitosamente"
Write-Host ""

# --- Info de imagenes ----------------------------------------------------
Show-Progress "Informacion de las imagenes construidas:"
Write-ColorOutput "Backend:" "Cyan"
docker images $BACKEND_IMAGE --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
Write-ColorOutput "Frontend:" "Cyan"
docker images $FRONTEND_IMAGE --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
Write-Host ""

# --- Push ----------------------------------------------------------------
Write-ColorOutput "Subiendo las imagenes a Docker Hub..." "Yellow"

Show-Progress "Subiendo backend ($Version)..."
docker push "$($BACKEND_IMAGE):$Version"
if ($LASTEXITCODE -ne 0) { Handle-Error "Fallo la subida del backend" }
if ($Version -ne "latest") {
    Show-Progress "Subiendo backend (latest)..."
    docker push "$($BACKEND_IMAGE):latest"
    if ($LASTEXITCODE -ne 0) { Handle-Error "Fallo la subida del backend (latest)" }
}

Show-Progress "Subiendo frontend ($Version)..."
docker push "$($FRONTEND_IMAGE):$Version"
if ($LASTEXITCODE -ne 0) { Handle-Error "Fallo la subida del frontend" }
if ($Version -ne "latest") {
    Show-Progress "Subiendo frontend (latest)..."
    docker push "$($FRONTEND_IMAGE):latest"
    if ($LASTEXITCODE -ne 0) { Handle-Error "Fallo la subida del frontend (latest)" }
}

Write-Host ""
Show-Success "Imagenes subidas exitosamente a Docker Hub!"
Write-Host ""
Write-ColorOutput "Enlaces a Docker Hub:" "Cyan"
Write-Host "   Backend:  https://hub.docker.com/r/$BACKEND_IMAGE"
Write-Host "   Frontend: https://hub.docker.com/r/$FRONTEND_IMAGE"
Write-Host ""
Write-ColorOutput "Para desplegar en Portainer:" "Cyan"
Write-Host "   1. Stacks -> Add stack -> pega docker-compose.remote.yml"
Write-Host "   2. Define las variables de entorno (ver .env.remote.example):"
Write-Host "      DOCKER_USERNAME=$DOCKER_USERNAME"
Write-Host "      IMAGE_TAG=$Version"
Write-Host "      DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET, ADMIN_INITIAL_PASSWORD..."
Write-Host "   3. Deploy the stack"
Write-Host ""
Write-ColorOutput "Proceso completado." "Green"
