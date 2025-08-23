@echo off
echo ========================================
echo    BLINKER 2.0 - GENERADOR DE EJECUTABLE
echo    Creado por el equipo Lyntrax
echo ========================================
echo.
echo Instalando dependencias...
npm install
echo.
echo Generando ejecutable...
npm run build-win
echo.
echo ========================================
echo EJECUTABLE GENERADO EXITOSAMENTE!
echo Ubicacion: dist/blinker-whatsapp-sender.exe
echo ========================================
pause
