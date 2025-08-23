@echo off
title BLINKER 2.0 - INSTALADOR AUTOMATICO
color 0A
echo.
echo ========================================
echo    BLINKER 2.0 - INSTALADOR AUTOMATICO
echo    Creado por el equipo Lyntrax
echo ========================================
echo.
echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    echo Descarga Node.js desde: https://nodejs.org
    pause
    exit
)
echo Node.js detectado correctamente
echo.
echo Instalando dependencias...
npm install --legacy-peer-deps
echo.
echo Creando carpetas necesarias...
if not exist "data" mkdir data
if not exist "uploads" mkdir uploads
echo.
echo ========================================
echo    INSTALACION COMPLETADA
echo ========================================
echo.
echo Para iniciar BLINKER 2.0, ejecuta:
echo    BLINKER-START.bat
echo.
pause
