@echo off
title BLINKER 2.0 - DIAGNOSTICO
color 0E
echo.
echo ========================================
echo    BLINKER 2.0 - DIAGNOSTICO COMPLETO
echo ========================================
echo.

echo 1. Verificando Node.js...
node --version
if errorlevel 1 (
    echo ❌ Node.js NO instalado
) else (
    echo ✅ Node.js instalado correctamente
)
echo.

echo 2. Verificando npm...
npm --version
if errorlevel 1 (
    echo ❌ npm NO disponible
) else (
    echo ✅ npm disponible
)
echo.

echo 3. Verificando archivos del proyecto...
if exist "index.js" (
    echo ✅ index.js encontrado
) else (
    echo ❌ index.js NO encontrado
)

if exist "package.json" (
    echo ✅ package.json encontrado
) else (
    echo ❌ package.json NO encontrado
)

if exist "public" (
    echo ✅ Carpeta public encontrada
) else (
    echo ❌ Carpeta public NO encontrada
)
echo.

echo 4. Verificando dependencias...
if exist "node_modules" (
    echo ✅ node_modules encontrado
) else (
    echo ❌ node_modules NO encontrado - Ejecuta BLINKER-INSTALLER.bat
)
echo.

echo ========================================
echo DIAGNOSTICO COMPLETO
echo ========================================
pause
