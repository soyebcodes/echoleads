# EchoLeads Python API

A lightweight FastAPI service for scraping Reddit-style posts and inserting high-intent leads into the Supabase/Postgres database used by the EchoLeads app.

## Run locally

```bash
cd apps/python-api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Health check

```bash
curl http://localhost:8000/health
```

## Trigger a run

```bash
curl -X POST http://localhost:8000/run -H "Content-Type: application/json" -d '{"campaign_id":"<campaign-id>"}'
```
