# EchoLeads Python API

A lightweight FastAPI service that powers the campaign scan workflow for EchoLeads. It pulls Reddit RSS data, filters and scores candidate posts, and writes matched leads into the shared Postgres/Supabase database.

## What it does

- Exposes a health endpoint for local and production checks
- Accepts scan triggers from the web app via POST /run
- Loads campaign context from the database
- Searches Reddit, scores the content, and inserts new leads when a match is strong enough

## Local setup

```powershell
cd apps/python-api
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run the API

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Health check

```powershell
curl http://localhost:8000/health
```

## Trigger a scan

```powershell
curl -X POST http://localhost:8000/run -H "Content-Type: application/json" -d '{"campaign_id":"<campaign-id>"}'
```

## Environment variables

Set these before running the API:

- DATABASE_URL: Postgres connection string for the shared EchoLeads database

The app will also look for environment values from the workspace .env files when available.
