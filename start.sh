#!/usr/bin/env bash
set -e

echo "🎮 ===== PokéGame Launcher ====="

# Vérifier Docker installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Installe-le d'abord : https://www.docker.com/"
    exit 1
fi

# Vérifier Docker daemon actif
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon non démarré. Lance Docker Desktop puis relance ce script."
    exit 1
fi

echo "✅ Docker OK"
echo "🚀 Lancement des services..."
docker compose up -d --build

echo "⏳ Attente que les services soient prêts..."
sleep 5

# Récupérer IP locale (Mac)
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "unavailable")

echo ""
echo "🎉 PokéGame est prêt !"
echo "📍 Sur ce Mac       : http://localhost:8080"
echo "📱 Autres devices   : http://$LOCAL_IP:8080"
echo ""
echo "💡 Utiliser 'make logs'  pour suivre les logs en direct"
echo "💡 Utiliser 'make down'  pour tout arrêter"
echo "💡 Utiliser 'make seed'  pour charger les 151 Pokémon"
