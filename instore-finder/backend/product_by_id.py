import sys
import requests
import re

#SEARCH_URL = "https://www.obi.de/search/weihnachtsbaum/" #https://www.obi.de/p/1041078

# ---- Toggle these if you need to diagnose corp proxy / CA trust issues ----
VERIFY = False                 # set to False ONLY to confirm a trust problem
CA_BUNDLE = None              # or set to r"C:\path\to\corp-ca.pem" (then VERIFY can be CA_BUNDLE)
PROXIES = None                # e.g. {"https": "http://user:pass@proxy.host:8080"}
# ---------------------------------------------------------------------------



HEADERS={
  'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language':'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7',
  'User-Agent':'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
};

def fetch_product_image_url(prod_id: str) -> str | None:
    """
    Fetch the OBI product page and extract a product image URL.

    We collect all 'bilder.obi.de/.../image.jpeg' URLs from the HTML and
    prefer a larger variant (e.g. 'pr00W') if available. If no preferred
    size is found, we fall back to the first match.
    """
    product_url = f"https://www.obi.de/p/{prod_id}"
    print(f"[DEBUG] Fetching: {product_url}", file=sys.stderr)

    try:
        resp = requests.get(
            product_url,
            headers=HEADERS,
            timeout=30,
            verify=CA_BUNDLE if CA_BUNDLE else VERIFY,
            proxies=PROXIES,
        )
        resp.raise_for_status()
    except Exception as e:
        print(f"[DEBUG] error fetching product page for {prod_id}: {e}", file=sys.stderr)
        return None

    html = resp.text

    # Find ALL image URLs, not just the first one
    candidates = re.findall(r"https://bilder\.obi\.de[^\"']+image\.jpeg", html)

    if not candidates:
        print(f"[DEBUG] no image URL found for {prod_id}", file=sys.stderr)
        return None

    print(f"[DEBUG] found {len(candidates)} image candidates for {prod_id}:", file=sys.stderr)
    for c in candidates:
        print(f"    {c}", file=sys.stderr)

    # Prefer larger variants – adjust this list if you discover other size codes
    preferred_tokens = [
        "/pr00W/",  # often larger web image
        "/pr00X/",
        "/pr0W/",
    ]

    for token in preferred_tokens:
        for url in candidates:
            if token in url:
                print(f"[DEBUG] using preferred image URL for {prod_id}: {url}", file=sys.stderr)
                return url

    # Fallback: use the first candidate
    chosen = candidates[0]
    print(f"[DEBUG] using first image URL for {prod_id}: {chosen}", file=sys.stderr)
    return chosen