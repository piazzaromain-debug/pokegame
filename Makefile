.PHONY: help up down logs logs-back logs-front seed reset-db test build

help:                  ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

up:                    ## Lance tous les services
	docker compose up -d
	@echo "🎮 PokéGame est lancé !"
	@echo "📍 Accès local : http://localhost:8080"
	@echo "📡 Accès réseau : http://$$(ipconfig getifaddr en0):8080"

down:                  ## Arrête tous les services
	docker compose down

logs:                  ## Affiche tous les logs
	docker compose logs -f

logs-back:             ## Logs backend uniquement
	docker compose logs -f backend

logs-front:            ## Logs frontend uniquement
	docker compose logs -f frontend

seed:                  ## Lance le seed Pokémon depuis PokeAPI
	docker compose exec backend python scripts/seed.py

reset-db:              ## ⚠️ Reset complet de la BDD (données perdues !)
	docker compose down -v
	docker compose up -d db
	sleep 5
	docker compose up -d
	make seed

test:                  ## Lance tous les tests (back + front)
	docker compose exec backend pytest
	docker compose exec frontend npm test

build:                 ## Rebuild complet des images Docker
	docker compose build --no-cache
