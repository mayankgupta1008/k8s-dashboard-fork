.PHONY: dev dev-backend dev-frontend build up down

dev: dev-backend dev-frontend

dev-backend:
	cd backend && pip install -e . && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down
