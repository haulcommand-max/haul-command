"""
Haul Command — FMCSA / Data Pipeline Scraper Engine
Phase 2 Deployment: Systematic ingestion of broker/carrier/operator data
into Supabase lb_ingestion_batches + lb_observations pipeline.

Usage:
    python scripts/hc_scraper_engine.py

Requires env vars:
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    FIRECRAWL_API_KEY (optional — falls back to direct HTTP scrape)
"""

import os
import sys
import json
import hashlib
import uuid
import time
import logging
from datetime import datetime, date
from typing import Dict, List, Optional

import requests

# ─── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
log = logging.getLogger("hc-scraper")

# ─── Config ─────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
FIRECRAWL_KEY = os.getenv("FIRECRAWL_API_KEY", "")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

# ─── Target sources ─────────────────────────────────────────────────────────
SOURCES = [
    {
        "source_name": "FMCSA SaferWeb Brokers",
        "source_type": "fmcsa_saferwebcargo",
        "url": "https://safer.fmcsa.dot.gov/keywordx.asp?searchstring=*&SEARCHTYPE=BROKER",
        "country_hint": "US",
    },
    {
        "source_name": "FMCSA Active Carriers",
        "source_type": "fmcsa_carrier",
        "url": "https://safer.fmcsa.dot.gov/keywordx.asp?searchstring=*&SEARCHTYPE=CARRIER",
        "country_hint": "US",
    },
    {
        "source_name": "Pilot Car Pilot Board (public)",
        "source_type": "pilot_car_board",
        "url": "https://www.pilotcarescort.com/boards/",
        "country_hint": "US",
    },
    # ── HYPER-RARE ROLE NODES (120-COUNTRY) ─────────────────────────────────
    {
        "source_name": "WCS Permits - Pilot Cars",
        "source_type": "wcs_permit_directory",
        "url": "https://wcspermits.com/pilot-cars/",
        "country_hint": "US",
    },
    {
        "source_name": "ODSNA Utility Directory",
        "source_type": "odsna_directory",
        "url": "https://odsna.com/directory/", 
        "country_hint": "CA", # NA cross-border
    },
    {
        "source_name": "ESC Regional Infrastructure Board",
        "source_type": "esc_infrastructure",
        "url": "https://www.esc.org/", 
        "country_hint": "EU",
    },
    # ── ENTERPRISE / LOAD BOARD ABSORPTION ────────────────────────────────
    {
        "source_name": "Wide Load Shipping - Trucking",
        "source_type": "wideload_shipping_trucking",
        "url": "https://wideloadshipping.com/trucking/", 
        "country_hint": "US",
    },
    {
        "source_name": "Wide Load Shipping (Global)",
        "source_type": "wideload_shipping_global",
        "url": "https://wideloadshipping.com/", 
        "country_hint": "US",
    },
    {
        "source_name": "Heavy Haulers Directory",
        "source_type": "heavy_haulers_directory",
        "url": "https://www.heavyhaulers.com/", 
        "country_hint": "US",
    },
    {
        "source_name": "DAT Load Boards - Heavy Haul",
        "source_type": "dat_load_board_heavy",
        "url": "https://www.dat.com/load-boards", 
        "country_hint": "US",
    },
    # ── ADVANCED PILOT CAR DIRECTORIES & BROKERS ─────────────────────────
    {
        "source_name": "OSW Haven Directory",
        "source_type": "osw_haven_directory",
        "url": "https://osowhaven.com/", 
        "country_hint": "US",
    },
    {
        "source_name": "Pilot Car Loads (Brokers)",
        "source_type": "pilot_car_loads_brokers",
        "url": "https://pilotcarloads.com/dashboard/loads", 
        "country_hint": "US",
    },
    {
        "source_name": "Truck Stops and Services",
        "source_type": "truck_stops_services",
        "url": "https://www.truckstopsandservices.com/", 
        "country_hint": "US",
    }
]

# ─── Helpers ────────────────────────────────────────────────────────────────

def _text_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:32]


def _batch_id() -> str:
    return f"batch-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:8]}"


def _supabase_post(path: str, payload: dict) -> Optional[dict]:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    resp = requests.post(url, headers=HEADERS, json=payload, timeout=30)
    if resp.status_code not in (200, 201):
        log.warning(f"Supabase POST {path} → {resp.status_code}: {resp.text[:300]}")
        return None
    try:
        return resp.json()
    except Exception:
        return {}


def _supabase_upsert(path: str, payload: dict, conflict_cols: str) -> Optional[dict]:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {**HEADERS, "Prefer": f"resolution=merge-duplicates,return=minimal"}
    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    if resp.status_code not in (200, 201):
        log.warning(f"Supabase UPSERT {path} → {resp.status_code}: {resp.text[:300]}")
        return None
    return {}


# ─── Scraper ────────────────────────────────────────────────────────────────

class HCScraperEngine:
    """
    Coordinates scraping of external data sources and ingesting
    structured observations into the Supabase data pipeline.
    """

    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. "
                "Copy from .env.local and export them."
            )
        log.info(f"Scraper engine initialized → {SUPABASE_URL}")

    # ── Firecrawl scrape ─────────────────────────────────────────────────────
    def _firecrawl_scrape(self, url: str) -> Optional[str]:
        if not FIRECRAWL_KEY:
            log.warning("FIRECRAWL_API_KEY not set — skipping Firecrawl, using direct HTTP.")
            return None
        try:
            resp = requests.post(
                "https://api.firecrawl.dev/v0/scrape",
                headers={"Authorization": f"Bearer {FIRECRAWL_KEY}"},
                json={"url": url},
                timeout=60,
            )
            if resp.status_code == 200:
                return resp.json().get("data", {}).get("content", "")
        except Exception as e:
            log.error(f"Firecrawl error for {url}: {e}")
        return None

    # ── Direct HTTP fallback ─────────────────────────────────────────────────
    def _direct_fetch(self, url: str) -> Optional[str]:
        try:
            resp = requests.get(
                url,
                headers={"User-Agent": "HaulCommand-DataBot/1.0 (haulcommand.com)"},
                timeout=30,
            )
            if resp.status_code == 200:
                return resp.text
        except Exception as e:
            log.error(f"Direct fetch error for {url}: {e}")
        return None

    def _fetch_content(self, url: str) -> Optional[str]:
        content = self._firecrawl_scrape(url)
        if not content:
            content = self._direct_fetch(url)
        return content

    # ── Parse raw content into observations ──────────────────────────────────
    def _parse_observations(self, raw_text: str, source: Dict) -> List[Dict]:
        """
        Lightweight structural parse — splits on newlines and identifies
        potential freight lead lines. For production, replace with an LLM
        extraction pass via Anthropic/Gemini.
        """
        observations = []
        lines = [l.strip() for l in raw_text.splitlines() if len(l.strip()) > 20]

        for line in lines[:500]:  # cap at 500 lines per batch
            obs = {
                "raw_line": line[:2000],
                "source_name": source["source_name"],
                "source_type": source["source_type"],
                "country_code": source.get("country_hint", "US"),
                "observed_date": date.today().isoformat(),
                "observed_date_uncertain": False,
                "parse_confidence": 0.3,
                "is_seed_data": False,
                "ingested_at": datetime.utcnow().isoformat(),
            }

            # Basic heuristic signal extraction
            lower = line.lower()
            if any(k in lower for k in ["pickup", "deliver", "from", "to ", "→", "->"]):
                obs["parse_confidence"] = 0.5
            if any(k in lower for k in ["pilot car", "escort", "wide load", "oversize"]):
                obs["service_type"] = "pilot_escort"
                obs["parse_confidence"] = min(0.7, obs["parse_confidence"] + 0.2)
            if any(k in lower for k in ["broker", "mc#", "mc ", "dot#"]):
                obs["service_type"] = "broker"
                obs["parse_confidence"] = min(0.7, obs["parse_confidence"] + 0.1)
            if "$" in line or "per mile" in lower or "/mi" in lower:
                obs["parse_confidence"] = min(0.8, obs["parse_confidence"] + 0.1)

            observations.append(obs)

        return observations

    # ── Push batch to Supabase ───────────────────────────────────────────────
    def _push_batch(self, raw_text: str, source: Dict, observations: List[Dict]) -> bool:
        batch_id = _batch_id()
        text_hash = _text_hash(raw_text)

        batch_record = {
            "id": batch_id,
            "raw_text": raw_text[:50000],  # cap at 50k chars
            "text_hash": text_hash,
            "source_name": source["source_name"],
            "source_type": source["source_type"],
            "country_hint": source.get("country_hint"),
            "supplied_date": date.today().isoformat(),
            "ingested_at": datetime.utcnow().isoformat(),
            "line_count": len(raw_text.splitlines()),
            "parsed_count": len(observations),
            "partial_count": 0,
            "unparsed_count": 0,
        }

        log.info(f"  → Pushing batch {batch_id} ({len(observations)} obs)")
        result = _supabase_post("lb_ingestion_batches", batch_record)
        if result is None:
            log.error("  ✗ Failed to push batch record")
            return False

        # Push observations in chunks of 50
        chunk_size = 50
        obs_with_batch = [{**o, "batch_id": batch_id} for o in observations]
        for i in range(0, len(obs_with_batch), chunk_size):
            chunk = obs_with_batch[i:i + chunk_size]
            _supabase_post("lb_observations", chunk)
            time.sleep(0.1)

        log.info(f"  ✓ Batch {batch_id} pushed — {len(observations)} observations")
        return True

    # ── Run all sources ──────────────────────────────────────────────────────
    def run(self):
        log.info("=" * 60)
        log.info("HAUL COMMAND — SCRAPER ENGINE STARTING")
        log.info(f"Sources: {len(SOURCES)} | Time: {datetime.utcnow().isoformat()}Z")
        log.info("=" * 60)

        total_obs = 0
        for source in SOURCES:
            log.info(f"\n[*] Source: {source['source_name']}")
            log.info(f"    URL: {source['url']}")

            content = self._fetch_content(source["url"])
            if not content:
                log.warning(f"  ✗ No content fetched for {source['source_name']}")
                continue

            log.info(f"  ✓ Fetched {len(content):,} chars")
            observations = self._parse_observations(content, source)
            log.info(f"  ✓ Parsed {len(observations)} observations")

            if observations:
                self._push_batch(content, source, observations)
                total_obs += len(observations)

            time.sleep(2)  # be polite to external servers

        log.info("\n" + "=" * 60)
        log.info(f"SCRAPER ENGINE COMPLETE — {total_obs} total observations pushed")
        log.info("=" * 60)


# ─── Entry point ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    engine = HCScraperEngine()
    engine.run()
