@echo off
REM Script d'arrêt simplifié pour l'application
REM Usage: stop.bat

echo.
echo ========================================
echo   🛑 OvO Messaging - Arret
echo ========================================
echo.

cd infrastructure
docker-compose down
cd ..

echo.
echo ========================================
echo   ✅ Application arretee
echo ========================================
echo.
echo 💡 Les donnees persistent dans les volumes Docker.
echo    Pour supprimer les donnees : cd infrastructure ^&^& docker-compose down -v
echo.
pause
