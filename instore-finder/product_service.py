from pathlib import Path
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.neighbors import NearestNeighbors
import joblib
import re

# neu: Import deiner Bild→Text Funktion
from image_to_text_ionos import image_to_text


# paths relative to this file
BASE_DIR = Path(__file__).parent

MODEL_PATH = BASE_DIR / "knn_model.joblib"
EMB_PATH = BASE_DIR / "X_emb.npy"
DATA_PATH = BASE_DIR / "products_clean.csv"


print("Lade Daten und Modell...")

# 1) load product data
df_prod = pd.read_csv(DATA_PATH, encoding="utf-8")
df_prod["Art_Nr"] = df_prod["Art_Nr"].astype(str).str.strip()

print("Produkte geladen:", len(df_prod))

# 2) load precomputed embeddings + knn
X_emb = np.load(EMB_PATH)
knn: NearestNeighbors = joblib.load(MODEL_PATH)

# 3) encoder (FAST, no embedding recomputation!)
encoder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

print("Service bereit.\n")


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------

def decode_lagerplatz(lp: str) -> str:
    try:
        sektor, gang, regal, fach = lp.split("-")
        return f"Sektor {sektor}, Gang {gang}, Regal {regal}, Fach {fach}"
    except:
        return f"Lagerplatz {lp}"


def predict_candidates(text: str, top_k: int = 5, search_k: int | None = None):
    """
    Find up to `top_k` candidates with UNIQUE Art_Nr.

    We query more neighbors (search_k) and then filter duplicates
    by Art_Nr, because the same article can appear multiple times
    in the CSV.
    """
    # how many neighbors to ask from KNN in total
    if search_k is None:
        # you can tune this factor; 30 is usually enough
        search_k = max(top_k * 6, top_k)

    q_emb = encoder.encode([text], convert_to_numpy=True)

    distances, indices = knn.kneighbors(q_emb, n_neighbors=search_k)
    distances = distances[0]
    indices = indices[0]

    results = []
    seen_artnr = set()

    for d, idx in zip(distances, indices):
        row = df_prod.iloc[idx]
        artnr = str(row["Art_Nr"]).strip()

        # skip duplicates
        if artnr in seen_artnr:
            continue

        seen_artnr.add(artnr)
        sim = 1 - d

        results.append(
            {
                "Art_Nr": artnr,
                "Art_Bezeichnung": row["Art_Bezeichnung"],
                "Lagerplatz": row["Lagerplatz"],
                "similarity": float(sim),
            }
        )

        if len(results) >= top_k:
            break

    return results



# ---------------------------------------------------------
# Main answer function (Text / Artikelnummer)
# ---------------------------------------------------------

def answer_query(user_text: str, min_sim: float = 0.4) -> str:
    user_text = user_text.strip()

    # 1. Artikelnummer im Text erkennen (egal wo)
    m = re.search(r"\b\d{3,}\b", user_text)
    if m:
        artnr = m.group(0)

        # Exists?
        if artnr not in df_prod["Art_Nr"].values:
            return (
                f"Wir haben alles durchsucht, "
                f"... aber leider konnten wir keinen passenden Treffer "
                f"für die Artikelnummer {artnr} finden."
            )

        # Exists → return real product
        row = df_prod[df_prod["Art_Nr"] == artnr].iloc[0]
        loc = decode_lagerplatz(row["Lagerplatz"])
        return (
            f"Der Artikel '{row['Art_Bezeichnung']}' "
            f"mit der Nummer {row['Art_Nr']} befindet sich bei {loc}."
        )

    # 2. Keine Nummer → SEMANTISCHER KNN
    candidates = predict_candidates(user_text, top_k=5)
    best = candidates[0]

    if best["similarity"] < min_sim:
        return "Ich bin mir nicht sicher, bitte beschreiben Sie das Produkt genauer."

    loc = decode_lagerplatz(best["Lagerplatz"])
    return (
        f"Ich vermute, Sie meinen den Artikel '{best['Art_Bezeichnung']}' "
        f"(Art.-Nr. {best['Art_Nr']}).\n"
        f"Er befindet sich bei {loc}.\n"
        f"(Ähnlichkeit/Score: {best['similarity']:.2f})"
    )



# ---------------------------------------------------------
# Image → Text → KNN
# ---------------------------------------------------------

def answer_from_image(image_path: str, min_sim: float = 0.4) -> str:
    """
    1. Holt eine Textbeschreibung vom Bild (IONOS Vision Modell).
    2. Nutzt dieselbe semantische Suche wie bei Textfragen.
    3. Gibt die TOP-5 Kandidaten zurück.
    """
    try:
        caption = image_to_text(image_path).strip()
    except Exception as e:
        return f"Fehler bei der Bildauswertung: {e}"

    if not caption:
        return "Ich konnte aus dem Bild keine sinnvolle Beschreibung erzeugen."

    print(f"[Debug] Bildbeschreibung: {caption}")

    # Top-5 Kandidaten holen
    candidates = predict_candidates(caption, top_k=5)
    if not candidates:
        return "Ich konnte keinen passenden Artikel zum Bild finden."

    best = candidates[0]
    best_sim = best["similarity"]

    lines = []
    lines.append(f"Bildbeschreibung: {caption}")
    lines.append("")

    if best_sim < min_sim:
        lines.append(
            "Achtung: Die Erkennung ist unsicher, hier sind trotzdem die 5 wahrscheinlichsten Artikel:"
        )
    else:
        lines.append("Hier sind die 5 wahrscheinlichsten Artikel zum Bild:")

    lines.append("")

    for i, c in enumerate(candidates, start=1):
        loc = decode_lagerplatz(c["Lagerplatz"])
        lines.append(
            f"{i}. {c['Art_Bezeichnung']} "
            f"(Art.-Nr. {c['Art_Nr']}), {loc} "
            f"(Score: {c['similarity']:.2f})"
        )

    return "\n".join(lines)


# ---------------------------------------------------------
# CLI test mode: Text ODER Bild
# ---------------------------------------------------------

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
