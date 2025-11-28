@echo off
REM Script de démarrage simplifié pour l'application
REM Usage: start.bat

echo.
echo ========================================
echo   🚀 OvO Messaging - Demarrage
echo ========================================
echo.

REM Vérifier que Docker est en cours d'exécution
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Erreur : Docker n'est pas en cours d'execution.
    echo    Veuillez demarrer Docker Desktop et reessayer.
    echo.
    pause
    exit /b 1
)

REM Vérifier que le fichier .env existe
if not exist .env (
    echo ⚠️  Fichier .env non trouve.
    if exist .env.example (
        echo    Creation d'un fichier .env a partir de .env.example...
        copy .env.example .env >nul
        echo ✅ Fichier .env cree. Veuillez le modifier avec vos valeurs.
        echo.
    ) else (
        echo ❌ Fichier .env.example non trouve.
        echo.
        pause
        exit /b 1
    )
)

echo 📦 Construction et demarrage des containers...
echo.
cd infrastructure
docker-compose up -d --build
cd ..

echo.
echo ========================================
echo   ✅ Application demarree !
echo ========================================
echo.
echo 📍 Acces a l'application :
echo    - Application web : http://localhost
echo    - Traefik Dashboard : http://localhost:8080
echo.
echo 🔍 Verification des services :
echo    curl http://localhost/users/health
echo    curl http://localhost/auth/health
echo    curl http://localhost/messages/health
echo.
echo 📋 Commandes utiles :
echo    - Voir les logs : cd infrastructure ^&^& docker-compose logs -f
echo    - Arreter : stop.bat
echo.
pause
