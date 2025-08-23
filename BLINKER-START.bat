@echo off
title BLINKER 2.0 - SISTEMA DE WHATSAPP
color 0B
echo.
echo ========================================
echo    BLINKER 2.0 - INICIANDO SISTEMA
echo    Creado por el equipo Lyntrax
echo ========================================
echo.

REM Verificar si Node.js está instalado
echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ ERROR: Node.js no está instalado
    echo.
    echo SOLUCION:
    echo 1. Ve a https://nodejs.org/
    echo 2. Descarga e instala Node.js LTS
    echo 3. Reinicia tu PC
    echo 4. Vuelve a ejecutar este archivo
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

REM Verificar si existe index.js
if not exist "index.js" (
    echo ❌ ERROR: No se encuentra index.js
    echo Asegúrate de estar en la carpeta correcta
    echo.
    pause
    exit /b 1
)

echo ✅ Archivo index.js encontrado
echo.

REM Verificar carpeta public
if not exist "public" (
    echo ❌ ERROR: No se encuentra la carpeta public
    echo.
    pause
    exit /b 1
)

echo ✅ Carpeta public encontrada
echo.

echo Iniciando servidor...
echo 🌐 Abre tu navegador en: http://localhost:3000
echo.
echo ⚠️  Si hay errores, se mostrarán abajo:
echo ========================================
echo.

REM Ejecutar el servidor y mantener ventana abierta si hay error
node index.js
if errorlevel 1 (
    echo.
    echo ❌ El servidor se cerró con errores
    echo.
)

echo.
echo ========================================
echo Presiona cualquier tecla para cerrar...
pause >nul
