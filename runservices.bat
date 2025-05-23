@echo off
setlocal enabledelayedexpansion

REM ---------------------------------------------------
REM Usage: start.bat ^<frontend_port^> ^<backend_port^>
REM ---------------------------------------------------

if "%~1"=="" (
  echo ERROR: Missing frontend port.
  echo Usage: %~nx0 ^<frontend_port^> ^<backend_port^>
  exit /b 1
)
if "%~2"=="" (
  echo ERROR: Missing backend port.
  echo Usage: %~nx0 ^<frontend_port^> ^<backend_port^>
  exit /b 1
)

set "FRONTEND_PORT=%~1"
set "BACKEND_PORT=%~2"

set /a tmp=%FRONTEND_PORT% >nul 2>&1
if errorlevel 1 (
  echo ERROR: Frontend port '%FRONTEND_PORT%' is not a valid number.
  exit /b 1
)
set /a tmp=%BACKEND_PORT% >nul 2>&1
if errorlevel 1 (
  echo ERROR: Backend port '%BACKEND_PORT%' is not a valid number.
  exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
  echo ERROR: Docker Compose not found. Please install Docker Compose or enable the Docker CLI plugin.
  exit /b 1
)

echo VITE_FRONTEND_PORT=%FRONTEND_PORT% > .env
if errorlevel 1 (
  echo ERROR: Failed to write .env in %CD%.
  exit /b 1
)
>>.env echo VITE_BACKEND_PORT=%BACKEND_PORT%
if errorlevel 1 (
  echo ERROR: Failed to append to .env in %CD%.
  exit /b 1
)

if not exist "..\BWT_BACKEND" (
  echo ERROR: Backend directory '..\BWT_BACKEND' not found.
  exit /b 1
)
echo PORT=%BACKEND_PORT% > "..\BWT_BACKEND\.env"
if errorlevel 1 (
  echo ERROR: Failed to write .env in ..\BWT_BACKEND.
  exit /b 1
)

echo Starting frontend services on port %FRONTEND_PORT%...
docker compose up --build -d
if errorlevel 1 (
  echo ERROR: Failed to start frontend services.
  exit /b 1
)

pushd "..\BWT_BACKEND" >nul
if errorlevel 1 (
  echo ERROR: Could not cd into backend folder.
  exit /b 1
)
echo Starting backend services on port %BACKEND_PORT%...
docker compose up --build -d
if errorlevel 1 (
  echo ERROR: Failed to start backend services.
  popd >nul
  exit /b 1
)
popd >nul

echo.
echo  Services are running...
echo    [Frontend] http://localhost:%FRONTEND_PORT%
echo     [Backend] http://localhost:%BACKEND_PORT%
exit /b 0
