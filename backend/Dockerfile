FROM python:3.12-slim

WORKDIR /app

# Installer uv (gestionnaire de paquets ultra-rapide)
RUN pip install uv

COPY pyproject.toml .
RUN uv sync --no-dev

COPY . .

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
