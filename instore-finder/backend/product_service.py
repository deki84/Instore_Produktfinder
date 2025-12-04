import os
import requests
import pandas as pd
import re

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
    url = f"{SUPABASE_URL}/rest/v1/products"
    params = {
        "select": "Art_Nr,Art_Bezeichnung,Lagerplatz,obi_image_url,Verpackung_Groesse,train_text",
        "limit": 10000,
    }
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    resp = requests.get(url, params=params, headers=headers, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    df = pd.DataFrame(data)
    df["Art_Nr"] = df["Art_Nr"].astype(str).str.strip()
    return df


try:
    df_prod = load_products_from_supabase()
    SERVICE_READY = True
    print("Produkte geladen:", len(df_prod))
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


def simple_search(query: str, limit: int = 5):
    """
    Very simple keyword-based search over 'Art_Bezeichnung'.
    Returns a list of dicts with Art_Nr, Art_Bezeichnung, Lagerplatz, score.
    """
    if not SERVICE_READY or df_prod is None:
        return []

    q = query.lower().strip()
    if not q:
        return []

    words = [w for w in re.findall(r"\w+", q) if len(w) > 2]

    def score_row(text: str) -> int:
        t = str(text).lower()
        return sum(1 for w in words if w in t)

    scores = df_prod["Art_Bezeichnung"].apply(score_row)
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
                "score": int(row["score"]),
            }
        )

    return results


def answer_query(user_text: str) -> str:
    """
    Main text-based lookup:
    - If user_text contains an Art_Nr, try exact match.
    - Otherwise use simple_search over the description.
    Returns a German explanation string.
    """
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
            return (
                f"Wir haben alles durchsucht, "
                f"aber leider keinen passenden Treffer "
                f"für die Artikelnummer {artnr} gefunden."
            )

        row = df_prod[df_prod["Art_Nr"] == artnr].iloc[0]
        loc = decode_lagerplatz(row.get("Lagerplatz", ""))
        return (
            f"Der Artikel '{row['Art_Bezeichnung']}' "
            f"mit der Nummer {row['Art_Nr']} befindet sich bei {loc}."
        )

    # No clear Art_Nr found → keyword search
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


def answer_from_image(image_path: str) -> str:
    """
    Run the OPENAI image model on a local file path,
    then do a simple_search with the generated caption.
    Returns a formatted text string (for backwards compatibility).
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

    candidates = simple_search(caption, limit=5)
    if not candidates:
        return "Ich konnte keinen passenden Artikel zum Bild finden."

    lines = []
    lines.append(f"Bildbeschreibung: {caption}")
    lines.append("")
    lines.append("Mögliche Artikel:")

    for i, c in enumerate(candidates, start=1):
        loc = decode_lagerplatz(c.get("Lagerplatz", ""))
        lines.append(
            f"{i}. {c['Art_Bezeichnung']} "
            f"(Art.-Nr. {c['Art_Nr']}), {loc}"
        )

    return "\n".join(lines)


def answer_from_image_structured(image_path: str, limit: int = 5) -> dict:
    """
    Run the OPENAI image model on a local file path,
    then do a simple_search with the generated caption.
    Returns structured product data as a dictionary with:
    - caption: The generated image description
    - products: List of product dicts with full details from DB
    """
    if not SERVICE_READY or df_prod is None:
        return {
            "error": "Der Bildservice ist noch nicht konfiguriert (Produktdaten fehlen).",
            "caption": "",
            "products": []
        }

    try:
        caption = image_to_text(image_path).strip()
    except Exception as e:
        return {
            "error": f"Fehler bei der Bildauswertung: {e}",
            "caption": "",
            "products": []
        }

    if not caption:
        return {
            "error": "Ich konnte aus dem Bild keine sinnvolle Beschreibung erzeugen.",
            "caption": "",
            "products": []
        }

    print(f"[Debug] Bildbeschreibung: {caption}")

    candidates = simple_search(caption, limit=limit)
    
    # Enrich candidates with full product data from DataFrame
    enriched_products = []
    for candidate in candidates:
        art_nr = candidate["Art_Nr"]
        # Find the full row in DataFrame
        product_row = df_prod[df_prod["Art_Nr"] == art_nr]
        
        if not product_row.empty:
            row = product_row.iloc[0]
            product_data = {
                "Art_Nr": str(row.get("Art_Nr", "")).strip(),
                "Art_Bezeichnung": row.get("Art_Bezeichnung", ""),
                "Lagerplatz": row.get("Lagerplatz", ""),
                "Lagerplatz_decoded": decode_lagerplatz(row.get("Lagerplatz", "")),
                "obi_image_url": row.get("obi_image_url", "") or None,
                "Verpackung_Groesse": row.get("Verpackung_Groesse", "") or None,
                "score": candidate.get("score", 0)
            }
            enriched_products.append(product_data)

    return {
        "caption": caption,
        "products": enriched_products,
        "error": None
    }


def get_product_by_art_nr(art_nr: str) -> dict | None:
    """
    Look up a single product row by Art_Nr in the in-memory DataFrame.

    This is used by the FastAPI endpoint /obi_image/{art_nr}
    to return the correct image URL for a given article number.
    """
    if df_prod is None:
        # Data was not loaded correctly at startup
        return None

    # Normalize incoming article number to the same format as in df_prod
    artnr_clean = str(art_nr).strip()

    # Filter DataFrame for matching Art_Nr
    rows = df_prod[df_prod["Art_Nr"] == artnr_clean]
    if rows.empty:
        # No product found for this article number
        return None

    # Take the first matching row
    row = rows.iloc[0]

    # Return a plain Python dict, so FastAPI can easily work with it
    return {
        "Art_Nr": str(row.get("Art_Nr", "")).strip(),
        "Art_Bezeichnung": row.get("Art_Bezeichnung", ""),
        "Lagerplatz": row.get("Lagerplatz", ""),

        "obi_image_url": row.get("obi_image_url", ""),
    }


if __name__ == "__main__":
    print("Produkt Service gestartet.")
    print("Wähle:")
    print("  [t] Textfrage / Artikelnummer")
    print("  [b] Bildpfad eingeben")
    print("  [exit] beenden\n")

    while True:
        mode = input("Modus (t/b/exit): ").strip().lower()

        if mode in {"exit", "quit", "q"}:
            break

        if mode == "t":
            q = input("Frage oder Artikelnummer: ").strip()
            print()
            print(answer_query(q))
            print()

        elif mode == "b":
            path = input("Pfad zum Bild: ").strip().strip('"')
            print()
            print(answer_from_image(path))
            print()

        else:
            print("Bitte 't' für Text, 'b' für Bild oder 'exit' zum Beenden.\n")