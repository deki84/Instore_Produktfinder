import os
import requests
import pandas as pd
import re

from product_by_id import fetch_product_image_url
from image_to_text_ionos import image_to_text
from dotenv import load_dotenv  
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

SERVICE_READY = False
df_prod: pd.DataFrame | None = None

print("Lade Produktdaten aus Supabase...")


def load_products_from_supabase() -> pd.DataFrame:
    """
    Load product rows from Supabase 'products' table into a DataFrame.
    Also includes the 'obi_image_url' column for frontend images.
    """
    print("SUPABASE_URL:", SUPABASE_URL)
    print("SUPABASE_SERVICE_KEY gesetzt:", bool(SUPABASE_KEY))  # True/False

    url = f"{SUPABASE_URL}/rest/v1/products"
    params = {
        "select": "Art_Nr,Art_Bezeichnung,Lagerplatz,obi_image_url,Verpackung_Groesse,train_text",
        "limit": 10000,
    }
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    print("Rufe Supabase URL auf:", url)
    resp = requests.get(url, params=params, headers=headers, timeout=30)
    print("Supabase Status-Code:", resp.status_code)
    print("Supabase Antwort (erste 300 Zeichen):", resp.text[:300])
    resp.raise_for_status()
    data = resp.json()
    df = pd.DataFrame(data)
    df["Art_Nr"] = df["Art_Nr"].astype(str).str.strip()
    return df

def fetch_product_from_supabase(art_nr: str) -> dict | None:
    """
    Fetch a single product row by Art_Nr directly from Supabase.
    Returns dict if found, else None.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None

    artnr_clean = str(art_nr).strip()
    url = f"{SUPABASE_URL}/rest/v1/products"
    params = {
        "Art_Nr": f"eq.{artnr_clean}",
        "select": "Art_Nr,Art_Bezeichnung,Lagerplatz,obi_image_url,Verpackung_Groesse,train_text",
        "limit": 1,
    }
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=15)
        if resp.status_code != 200:
            print(f"[DEBUG] fetch_product_from_supabase status {resp.status_code}: {resp.text[:200]}")
            return None
        data = resp.json()
        if not data:
            return None
        return data[0]
    except Exception as e:
        print(f"[DEBUG] fetch_product_from_supabase error for {artnr_clean}: {e}")
        return None


def update_product_image_url(art_nr: str, image_url: str) -> None:
    """
    Store the discovered image URL back into Supabase and update df_prod.
    """
    if not SUPABASE_URL or not SUPABASE_KEY or df_prod is None:
        return

    artnr_clean = str(art_nr).strip()

    url = f"{SUPABASE_URL}/rest/v1/products"
    params = {
        "Art_Nr": f"eq.{artnr_clean}",
    }
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    payload = {"obi_image_url": image_url}

    try:
        resp = requests.patch(url, params=params, headers=headers, json=payload, timeout=30)
        if resp.status_code in (200, 204):
            df_prod.loc[df_prod["Art_Nr"] == artnr_clean, "obi_image_url"] = image_url
        else:
            print(f"[DEBUG] failed to update obi_image_url for {artnr_clean}: {artnr_clean}: {resp.status_code} {resp.text[:200]}")
    except Exception as e:
        print(f"[DEBUG] exception while updating obi_image_url for {artnr_clean}: {e}")

try:
    df_prod = load_products_from_supabase()
    SERVICE_READY = True
    print("Produkte geladen:", len(df_prod))
    print("Beispiel-Art_Nr:", df_prod["Art_Nr"].head(10).tolist())
    print("Service bereit.\n")
except Exception as e:
    print("Fehler beim Laden aus Supabase:", e)
    print("Service startet ohne Produktsuche.\n")

    

def decode_lagerplatz(lp: str) -> str:
    """
    Convert a raw Lagerplatz string like 'A-12-03-02'
    into a more human readable German description.
    """
    try:
        sektor, gang, regal, fach = lp.split("-")
        return f"Sektor {sektor}, Gang {gang}, Regal {regal}, Fach {fach}"
    except Exception:
        return f"Lagerplatz {lp}"

STOPWORDS = {
   "das", "bild", "zeigt", "eine", "einen", "der", "die", "den",
   "ist", "im", "vom", "mit", "und", "oder", "einem", "einer",
   "hand", "hintergrund"   
}

# Category mapping for intelligent prioritization
CATEGORY_KEYWORDS = {
    "farbe": ["farbe", "lack", "anstrich", "pinsel", "roller", "wände", "wand", "weiß", "schwarz", "rot", "blau", "grün", "gelb"],
    "fliesen": ["fliesen", "fliese", "badezimmer", "küche", "wand", "boden"],
    "holz": ["holz", "bretter", "latten", "dielen", "parkett", "leiste"],
    "werkzeug": ["schrauben", "dübel", "bohrer", "hammer", "zange", "schraubendreher"],
    "garten": ["garten", "erde", "dünger", "blumen", "pflanzen", "gartenstuhl", "gartenmöbel"],
    "elektro": ["kabel", "steckdose", "schalter", "lampe", "leuchte", "birne"],
    "sanitär": ["waschbecken", "spüle", "toilette", "dusche", "badewanne", "armatur", "keramik"],
}

def extract_keywords_and_category(query: str) -> tuple[list[str], str | None]:
    """
    Extracts important keywords from the query and detects the category.
    Returns: (keywords, category)
    """
    q_lower = query.lower()
    words = [w for w in re.findall(r"\w+", q_lower) if len(w) > 2 and w not in STOPWORDS]
    
    # Detect category based on keywords
    detected_category = None
    max_matches = 0
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        matches = sum(1 for kw in keywords if kw in q_lower)
        if matches > max_matches:
            max_matches = matches
            detected_category = category
    
    return words, detected_category

def simple_search(query: str, limit: int = 5):
    """
    Improved keyword-based search with AI prioritization:
    - Searches Art_Bezeichnung and train_text
    - Prioritizes products based on detected categories
    - Weights important keywords higher
    """
    if not SERVICE_READY or df_prod is None:
        return []

    q = query.lower().strip()
    if not q:
        return []

    keywords, category = extract_keywords_and_category(query)
    
    if not keywords:
        return []

    def score_row(row) -> float:
        """
        Calculates a score for a product row.
        Higher scores for:
        - More keyword matches
        - Matches in Art_Bezeichnung (weighted higher than train_text)
        - Category matches
        """
        score = 0.0
        
        # Search Art_Bezeichnung (highest priority)
        bezeichnung = str(row.get("Art_Bezeichnung", "")).lower()
        for kw in keywords:
            if kw in bezeichnung:
                score += 3.0  # Higher weight for Art_Bezeichnung
        
        # Search train_text (if available)
        train_text = row.get("train_text", None)
        if pd.notna(train_text) and train_text:
            train_text_lower = str(train_text).lower()
            for kw in keywords:
                if kw in train_text_lower:
                    score += 1.0  # Lower weight for train_text
        
        # Category bonus: If category detected, boost matching products
        if category:
            category_keywords = CATEGORY_KEYWORDS.get(category, [])
            bezeichnung_and_text = bezeichnung
            if pd.notna(train_text) and train_text:
                bezeichnung_and_text += " " + str(train_text).lower()
            
            # Check if product matches this category
            category_matches = sum(1 for ckw in category_keywords if ckw in bezeichnung_and_text)
            if category_matches > 0:
                score += 2.0 * category_matches  # Bonus for category matches
        
        return score

    scores = df_prod.apply(score_row, axis=1)
    df_scored = df_prod.copy()
    df_scored["score"] = scores

    df_best = df_scored[df_scored["score"] > 0].sort_values(
        by="score", ascending=False
    ).head(limit)

    results = []
    for _, row in df_best.iterrows():
        results.append(
            {
                "Art_Nr": str(row["Art_Nr"]).strip(),
                "Art_Bezeichnung": row["Art_Bezeichnung"],
                "Lagerplatz": row.get("Lagerplatz", ""),
                "score": float(row["score"]),
            }
        )

    return results

def answer_query(user_text: str) -> str:
    """
    Main text-based lookup:
    - If user_text contains an Art_Nr, try exact match (+ image URL).
    - Otherwise use simple_search over the description.
    """
    global df_prod
    if not SERVICE_READY or df_prod is None:
        return "Der Produktservice ist noch nicht konfiguriert (Produktdaten fehlen)."

    user_text = user_text.strip()
    if not user_text:
        return "Bitte geben Sie eine Beschreibung oder Artikelnummer ein."

    # Try to detect a numeric article number within the text
    m = re.search(r"\b\d{3,}\b", user_text)
    if m:
        artnr = m.group(0)

        if artnr not in df_prod["Art_Nr"].values:
            # Attempt: load directly from Supabase (for newly added products)
            try:
                fetched = fetch_product_from_supabase(artnr)
                if fetched:
                    # Insert into DataFrame and reuse
                    fetched_row = pd.DataFrame([fetched])
                    fetched_row["Art_Nr"] = fetched_row["Art_Nr"].astype(str).str.strip()
                    df_prod = pd.concat([df_prod, fetched_row], ignore_index=True)
                else:
                    return (
                        f"Wir haben alles durchsucht, "
                        f"aber leider keinen passenden Treffer "
                        f"für die Artikelnummer {artnr} gefunden."
                    )
            except Exception as e:
                print(f"[DEBUG] Error fetching product {artnr} from Supabase: {e}")
                return (
                    f"Wir haben alles durchsucht, "
                    f"aber leider keinen passenden Treffer "
                    f"für die Artikelnummer {artnr} gefunden."
                )

        row = df_prod[df_prod["Art_Nr"] == artnr].iloc[0]
        loc = decode_lagerplatz(row.get("Lagerplatz", ""))

        # DB first
        obi_image_url = row.get("obi_image_url", "") or None

        # Fallback: fetch from obi.de and store in Supabase
        if obi_image_url is None:
            try:
                fetched_url = fetch_product_image_url(artnr)
                if fetched_url:
                    obi_image_url = fetched_url
                    update_product_image_url(artnr, fetched_url)
            except Exception as e:
                print(f"[DEBUG] error fetching image URL for {artnr}: {e}")

        base_text = (
            f"Der Artikel '{row['Art_Bezeichnung']}' "
            f"mit der Nummer {row['Art_Nr']} befindet sich bei {loc}."
        )

        if obi_image_url:
            return base_text + f"\nBild-URL: {obi_image_url}"

        return base_text

    # No clear Art_Nr found → use keyword search
    candidates = simple_search(user_text, limit=5)
    if not candidates:
        return "Ich konnte keine passenden Artikel finden."

    best = candidates[0]
    loc = decode_lagerplatz(best.get("Lagerplatz", ""))

    lines = []
    lines.append(
        f"Ich vermute, Sie meinen den Artikel '{best['Art_Bezeichnung']}' "
        f"(Art.-Nr. {best['Art_Nr']})."
    )
    lines.append(f"Er befindet sich bei {loc}.")
    lines.append("")
    lines.append("Weitere mögliche Treffer:")

    for c in candidates[1:]:
        loc_c = decode_lagerplatz(c.get("Lagerplatz", ""))
        lines.append(
            f"- {c['Art_Bezeichnung']} (Art.-Nr. {c['Art_Nr']}), {loc_c}"
        )

    return "\n".join(lines)

    
def answer_from_image(image_path: str, limit: int = 5) -> str:
    """
    Classic version: image -> caption -> simple_search, returns plain text.
    Used mainly for debugging or CLI usage.
    """
    if not SERVICE_READY or df_prod is None:
        return "Der Bildservice ist noch nicht konfiguriert (Produktdaten fehlen)."

    try:
        caption = image_to_text(image_path).strip()
    except Exception as e:
        return f"Fehler bei der Bildauswertung: {e}"

    if not caption:
        return "Ich konnte aus dem Bild keine sinnvolle Beschreibung erzeugen."

    print(f"[Debug] Bildbeschreibung: {caption}")

    candidates = simple_search(caption, limit=limit)
    if not candidates:
        return "Ich konnte keinen passenden Artikel zum Bild finden."

    lines: list[str] = []
    lines.append(f"Bildbeschreibung: {caption}")
    lines.append("")
    lines.append("Mögliche Artikel:")

    for i, c in enumerate(candidates, start=1):
        loc = decode_lagerplatz(c.get("Lagerplatz", ""))
        lines.append(
            f"{i}. {c['Art_Bezeichnung']} (Art.-Nr. {c['Art_Nr']}), {loc}"
        )

    return "\n".join(lines)

def get_product_by_art_nr(art_nr: str) -> dict | None:
    """
    Look up a single product by Art_Nr in the loaded DataFrame.
    If not found, tries to fetch from Supabase dynamically.

    Returns:
      - dict with all columns (including obi_image_url) if found
      - None if no matching product exists or the service is not ready
    """
    global df_prod
    # If service or dataframe is not ready, abort
    if not SERVICE_READY or df_prod is None:
        return None

    # Normalize article number (string, stripped)
    artnr_clean = str(art_nr).strip()

    # Filter dataframe by Art_Nr
    rows = df_prod[df_prod["Art_Nr"] == artnr_clean]
    if rows.empty:
        # Attempt: load directly from Supabase (for newly added products)
        try:
            fetched = fetch_product_from_supabase(artnr_clean)
            if fetched:
                # Insert into DataFrame and reuse
                fetched_row = pd.DataFrame([fetched])
                fetched_row["Art_Nr"] = fetched_row["Art_Nr"].astype(str).str.strip()
                df_prod = pd.concat([df_prod, fetched_row], ignore_index=True)
                # Now it should be in the DataFrame
                rows = df_prod[df_prod["Art_Nr"] == artnr_clean]
                if rows.empty:
                    return None
            else:
                return None
        except Exception as e:
            print(f"[DEBUG] Error fetching product {artnr_clean} from Supabase in get_product_by_art_nr: {e}")
            return None

    # Convert first row to a plain dict for FastAPI
    row = rows.iloc[0]
    return row.to_dict()

    
def simple_search_structured(ai_data: dict, limit: int = 5) -> list[dict]:
    """
    Enhanced search using structured AI data (produktname, typ, material, farbe, etc.).
    Prioritizes matches based on specific fields.
    """
    if not SERVICE_READY or df_prod is None:
        return []

    # Extract all relevant keywords from structured data
    search_terms = []
    
    produktname = str(ai_data.get("produktname", "")).lower().strip()
    if produktname and produktname != "kein produkt erkannt":
        search_terms.append(produktname)
    
    typ = str(ai_data.get("typ", "")).lower().strip()
    if typ:
        search_terms.append(typ)
    
    material = str(ai_data.get("material", "")).lower().strip()
    if material:
        search_terms.append(material)
    
    farbe = str(ai_data.get("farbe", "")).lower().strip()
    if farbe:
        search_terms.append(farbe)
    
    behaelter = str(ai_data.get("behaelter", "")).lower().strip()
    if behaelter:
        search_terms.append(behaelter)
    
    wichtige_merkmale = str(ai_data.get("wichtige_merkmale", "")).lower().strip()
    if wichtige_merkmale:
        search_terms.append(wichtige_merkmale)
    
    if not search_terms:
        return []

    # Combine all search terms
    combined_query = " ".join(search_terms)
    
    def score_row_structured(row) -> float:
        """
        Calculates a score for a product row based on structured AI data.
        Higher scores for:
        - Matches in produktname (highest priority)
        - Matches in material, farbe, behaelter (high priority)
        - Matches in typ, wichtige_merkmale (medium priority)
        - Matches in Art_Bezeichnung (high priority)
        - Matches in train_text (lower priority)
        """
        score = 0.0
        
        bezeichnung = str(row.get("Art_Bezeichnung", "")).lower()
        train_text = row.get("train_text", None)
        train_text_lower = str(train_text).lower() if pd.notna(train_text) and train_text else ""
        combined_text = f"{bezeichnung} {train_text_lower}"
        
        # Product name match (highest priority)
        if produktname and produktname != "kein produkt erkannt":
            if produktname in bezeichnung:
                score += 10.0  # Very high weight for product name
            elif any(word in bezeichnung for word in produktname.split() if len(word) > 3):
                score += 5.0
        
        # Material match (high priority)
        if material:
            material_words = [w for w in material.split() if len(w) > 2]
            for mw in material_words:
                if mw in combined_text:
                    score += 4.0
        
        # Color match (high priority)
        if farbe:
            farbe_words = [w for w in farbe.split() if len(w) > 2]
            for fw in farbe_words:
                if fw in combined_text:
                    score += 4.0
        
        # Container match (high priority)
        if behaelter:
            behaelter_words = [w for w in behaelter.split() if len(w) > 2]
            for bw in behaelter_words:
                if bw in combined_text:
                    score += 4.0
        
        # Type match (medium priority)
        if typ:
            typ_words = [w for w in typ.split() if len(w) > 2]
            for tw in typ_words:
                if tw in combined_text:
                    score += 3.0
        
        # Important features match (medium priority)
        if wichtige_merkmale:
            merkmale_words = [w for w in wichtige_merkmale.split() if len(w) > 2]
            for mw in merkmale_words:
                if mw in combined_text:
                    score += 2.0
        
        # General keyword match in Art_Bezeichnung
        for term in search_terms:
            words = [w for w in term.split() if len(w) > 2]
            for word in words:
                if word in bezeichnung:
                    score += 2.0
                elif word in train_text_lower:
                    score += 1.0
        
        return score

    scores = df_prod.apply(score_row_structured, axis=1)
    df_scored = df_prod.copy()
    df_scored["score"] = scores

    df_best = df_scored[df_scored["score"] > 0].sort_values(
        by="score", ascending=False
    ).head(limit)

    results = []
    for _, row in df_best.iterrows():
        results.append(
            {
                "Art_Nr": str(row["Art_Nr"]).strip(),
                "Art_Bezeichnung": row["Art_Bezeichnung"],
                "Lagerplatz": row.get("Lagerplatz", ""),
                "score": float(row["score"]),
            }
        )

    return results

def answer_from_image_structured(image_path: str, limit: int = 5) -> dict:
    """
    Run the OPENAI image model on a local file path with structured output,
    then do an enhanced search using the structured data.
    Returns structured product data as a dictionary with:
    - caption: Human-readable description (formatted from structured data)
    - structured_data: The parsed JSON from AI
    - products: List of product dicts with full details from DB
    """
    if not SERVICE_READY or df_prod is None:
        return {
            "error": "Der Bildservice ist noch nicht konfiguriert (Produktdaten fehlen).",
            "caption": "",
            "structured_data": None,
            "products": []
        }

    try:
        # Request structured JSON output
        ai_data = image_to_text(image_path, structured=True)
        
        # Handle both dict (structured) and str (fallback) responses
        if isinstance(ai_data, str):
            # Fallback: treat as plain text
            print(f"[WARNING] AI returned plain text instead of JSON: {ai_data}")
            candidates = simple_search(ai_data, limit=limit)
            return {
                "caption": ai_data,
                "structured_data": None,
                "products": []
            }
        
        # Format human-readable caption from structured data
        caption_parts = []
        if ai_data.get("produktname") and ai_data.get("produktname") != "Kein Produkt erkannt":
            caption_parts.append(f"Produktname: {ai_data.get('produktname')}")
        if ai_data.get("typ"):
            caption_parts.append(f"Typ: {ai_data.get('typ')}")
        if ai_data.get("material"):
            caption_parts.append(f"Material: {ai_data.get('material')}")
        if ai_data.get("farbe"):
            caption_parts.append(f"Farbe: {ai_data.get('farbe')}")
        if ai_data.get("groesse"):
            caption_parts.append(f"Größe: {ai_data.get('groesse')}")
        if ai_data.get("form"):
            caption_parts.append(f"Form: {ai_data.get('form')}")
        if ai_data.get("behaelter"):
            caption_parts.append(f"Behälter: {ai_data.get('behaelter')}")
        if ai_data.get("wichtige_merkmale"):
            caption_parts.append(f"Wichtige Merkmale: {ai_data.get('wichtige_merkmale')}")
        
        caption = "\n".join(caption_parts) if caption_parts else "Kein Produkt erkannt"
        
        print(f"[Debug] Strukturierte KI-Daten: {ai_data}")
        print(f"[Debug] Formatierte Beschreibung: {caption}")

        # Use enhanced structured search
        candidates = simple_search_structured(ai_data, limit=limit)
        
    except Exception as e:
        import traceback
        print(f"[ERROR] Fehler bei der Bildauswertung: {traceback.format_exc()}")
        return {
            "error": f"Fehler bei der Bildauswertung: {e}",
            "caption": "",
            "structured_data": None,
            "products": []
        }

    enriched_products = []

    for candidate in candidates:
        art_nr = candidate["Art_Nr"]

        # Find the full row in the DataFrame
        product_row = df_prod[df_prod["Art_Nr"] == art_nr]
        if product_row.empty:
            continue

        row = product_row.iloc[0]

        # 1) Try image URL from database first
             # 1) Read image URL from DB and normalize NaN / empty to None
        raw_val = row.get("obi_image_url", None)
        if pd.isna(raw_val) or raw_val in ("", None):
            obi_image_url = None
        else:
            obi_image_url = str(raw_val).strip() or None

        # 2) If still None → fetch from obi.de and store in DB + df_prod
        if obi_image_url is None:
            try:
                fetched_url = fetch_product_image_url(art_nr)
                if fetched_url:
                    obi_image_url = fetched_url
                    update_product_image_url(art_nr, fetched_url)
            except Exception as e:
                print(f"[DEBUG] error fetching image URL for {art_nr}: {e}")
                obi_image_url = None

        # Get train_text (description) from Supabase
        train_text_raw = row.get("train_text", None)
        train_text = None
        if pd.notna(train_text_raw) and train_text_raw not in ("", None):
            train_text = str(train_text_raw).strip() or None

        product_data = {
            "Art_Nr": str(row.get("Art_Nr", "")).strip(),
            "Art_Bezeichnung": row.get("Art_Bezeichnung", ""),
            "Lagerplatz": row.get("Lagerplatz", ""),
            "Lagerplatz_decoded": decode_lagerplatz(row.get("Lagerplatz", "")),
            "obi_image_url": obi_image_url,
            "Verpackung_Groesse": row.get("Verpackung_Groesse", "") or None,
            "train_text": train_text,
            "score": candidate.get("score", 0),
        }

        enriched_products.append(product_data)

    return {
        "caption": caption,
        "structured_data": ai_data if not isinstance(ai_data, str) else None,
        "products": enriched_products,
        "error": None
    }

    