import asyncio
from playwright.async_api import async_playwright
import json
import re

# Haul Command Global Intelligence Unit
# 120-Country Tiered Regulatory Web Scraper 
# Purpose: Extract dimension tables, capability strings, and certification rules from global DOTs/MOTs

class GlobalRegulatoryScraper:
    def __init__(self):
        self.results = []
        self.targets = {
            "tier_a": [
                {
                    "country": "US",
                    "agency": "TX_DOT",
                    "url": "https://www.txdmv.gov/motor-carriers/oversize-overweight-permits/texas-size-and-weight-limits",
                    "schema": "us_state_limits"
                },
                {
                    "country": "AU",
                    "agency": "NHVR",
                    "url": "https://www.nhvr.gov.au/road-access/mass-dimension-and-loading/heavy-vehicle-general-mass-and-dimension-limits",
                    "schema": "au_national_limits"
                },
                {
                    "country": "DE",
                    "agency": "BMDV",
                    "url": "https://bmdv.bund.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/grosstransporte-und-schwertransporte.html",
                    "schema": "de_schwertransport"
                }
            ],
            "tier_b": [
                {
                    "country": "FR",
                    "agency": "Securite Routiere (Ministere de l'Interieur)",
                    "url": "https://www.securite-routiere.gouv.fr/reglementation-liee-aux-vehicules/transports-exceptionnels",
                    "schema": "fr_convoi_exceptionnel"
                },
                {
                    "country": "MX",
                    "agency": "SCT (Secretaria de Comunicaciones y Transportes)",
                    "url": "https://www.gob.mx/sct/documents/norma-oficial-mexicana-nom-040-sct-2-2012-para-el-transporte-de-objetos-indivisibles-de-gran-peso-yo-volumen-peso-y-dimensiones",
                    "schema": "mx_nom_040"
                }
            ]
        }

    # ... [Tier A Extractors Omitted for Brevity in this View, existing logic persists] ...

    async def extract_fr_convoi(self, page):
        """Extract French Category 1, 2, and 3 Convoi Exceptionnel rules."""
        await page.wait_for_selector('main', timeout=10000)
        
        # Scrape for specific category dimensional bounds 
        # (e.g. Cat 1 = L < 20m, W < 3m. Cat 2 = L < 25m, W < 4m. Cat 3 > 25m/4m)
        text = await page.evaluate('() => document.body.innerText')
        
        normalized = {
            "entity": "Ministère de l'Intérieur",
            "country": "FR",
            "categories_extracted": [],
            "escort_terminology": []
        }
        
        # Look for the categorization logic (Catégorie 1, 2, 3)
        if "catégorie 1" in text.lower() or "1ère catégorie" in text.lower():
             normalized["categories_extracted"].append({
                 "category": 1,
                 "escort_required": False # Flashing lights only
             })
        if "catégorie 2" in text.lower():
             normalized["categories_extracted"].append({
                 "category": 2,
                 "escort_required": True,
                 "role": "voiture pilote"
             })
        if "catégorie 3" in text.lower():
             normalized["categories_extracted"].append({
                 "category": 3,
                 "escort_required": True,
                 "roles": ["voiture pilote", "escorte policière moto"]
             })
             
        # Extract vocabulary mappings
        if "voiture pilote" in text.lower():
            normalized["escort_terminology"].append("voiture_pilote")
        if "moto" in text.lower():
            normalized["escort_terminology"].append("escorte_moto")
            
        return normalized

    async def extract_mx_sct(self, page):
        """Extract Mexican NOM-040-SCT limits."""
        # Mexico uses "Vehículo Piloto" with specific flag and sign mandates per SCT norms.
        await page.wait_for_selector('main', timeout=10000)
        text = await page.evaluate('() => document.body.innerText')
        
        normalized = {
            "entity": "SCT (NOM-040-SCT-2-2012)",
            "country": "MX",
            "roles_extracted": []
        }
        
        if "vehículo piloto" in text.lower():
             normalized["roles_extracted"].append("vehiculo_piloto")
        if "exceso de dimensiones" in text.lower():
             normalized["roles_extracted"].append("overdimensional_sign_requirement")
             
        return normalized

    async def run(self):
        print("[Haul Command] Booting Tier A & B Regulatory Scraper...")
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            # Process Tier B Targets (New Expansion)
            for target in self.targets["tier_b"]:
                print(f"Scraping {target['country']} - {target['agency']} at {target['url']}")
                try:
                    await page.goto(target['url'], wait_until="networkidle")
                    
                    extracted_data = {}
                    if target["schema"] == "fr_convoi_exceptionnel":
                        extracted_data = await self.extract_fr_convoi(page)
                    elif target["schema"] == "mx_nom_040":
                        extracted_data = await self.extract_mx_sct(page)
                    else:
                        extracted_data = {"error": "schema_handler_missing"}
                        
                    self.results.append({
                        "country": target["country"],
                        "agency": target["agency"],
                        "url": target["url"],
                        "data": extracted_data
                    })
                except Exception as e:
                    print(f"Failed to scrape {target['country']}: {str(e)}")

            await browser.close()
            
        with open('scraper_output_tier_b.json', 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=4)
        print("Scrape complete. Output saved to scraper_output_tier_b.json")

if __name__ == "__main__":
    asyncio.run(GlobalRegulatoryScraper().run())
