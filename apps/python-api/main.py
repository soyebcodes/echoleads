import os
import re
from typing import List, Optional
from bs4 import BeautifulSoup
import requests
import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="EchoLeads Python API", version="1.0.0")

DATABASE_URL = os.getenv("DATABASE_URL")


class RunRequest(BaseModel):
    campaign_id: Optional[str] = None


class LeadPayload(BaseModel):
    campaign_id: str
    reddit_post_id: str
    title: str
    content: str
    url: str
    author: str
    ai_relevance_score: int
    status: str = "new"


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/run")
def run_scan(payload: RunRequest) -> dict:
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="DATABASE_URL is not configured")

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id, name, description, target_description, lead_type, time_filter_days
        FROM campaigns
        WHERE (%s::uuid IS NULL OR id = %s)
        ORDER BY created_at DESC
        LIMIT 5
        """,
        (payload.campaign_id, payload.campaign_id),
    )
    campaigns = cur.fetchall()

    if not campaigns:
        cur.close()
        conn.close()
        return {"status": "ok", "message": "No campaigns found"}

    for campaign in campaigns:
        campaign_id, name, description, target_description, lead_type, time_filter_days = campaign
        search_query = build_search_query(name, description, target_description, lead_type)
        rss_url = f"https://www.reddit.com/search.rss?q={requests.utils.quote(search_query)}&sort=new&t=week"

        try:
            response = requests.get(rss_url, timeout=20, headers={"User-Agent": "EchoLeadsBot/1.0"})
            response.raise_for_status()
        except Exception as exc:
            print(f"Reddit fetch failed for {name}: {exc}")
            continue

        soup = BeautifulSoup(response.text, "xml")
        entries = soup.find_all("entry")
        for entry in entries:
            title = clean_text(entry.title.get_text() if entry.title else "")
            content = clean_text(entry.content.get_text() if entry.content else "")
            author = clean_text(entry.author.find("name").get_text() if entry.author and entry.author.find("name") else "")
            url = entry.link.get("href", "") if entry.link else ""
            post_id = entry.id.get_text() if entry.id else ""

            if not title and not content:
                continue

            score = score_relevance(title, content, description, target_description)
            if score < 70:
                continue

            cur.execute(
                """
                INSERT INTO leads (campaign_id, reddit_post_id, title, content, url, author, ai_relevance_score, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (reddit_post_id) DO NOTHING
                """,
                (campaign_id, post_id, title, content, url, author, score, "new"),
            )

    conn.commit()
    cur.close()
    conn.close()
    return {"status": "ok", "processed": len(campaigns)}


def build_search_query(name: str, description: Optional[str], target_description: Optional[str], lead_type: Optional[str]) -> str:
    seed_terms = []
    for value in [name, description, target_description]:
        if value:
            seed_terms.extend(re.split(r"[^a-z0-9]+", value.lower()))

    extra_terms = ["freelancer", "developer", "hire", "saas", "startup"] if lead_type == "service" else ["saas", "software", "tool", "startup"]
    terms = [t for t in set(seed_terms + extra_terms) if len(t) > 2 and t not in {"the", "and", "for", "with", "that", "this", "your", "help", "looking"}]
    terms = terms[:6]
    return " OR ".join(f'"{term}"' for term in terms) if terms else "saas"


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def score_relevance(title: str, content: str, description: Optional[str], target_description: Optional[str]) -> int:
    text = f"{title} {content} {description or ''} {target_description or ''}".lower()
    matches = 0
    if "freelancer" in text:
        matches += 20
    if "developer" in text:
        matches += 20
    if "saas" in text:
        matches += 15
    if "hire" in text:
        matches += 10
    if "need" in text:
        matches += 10
    return min(100, matches + 20)
