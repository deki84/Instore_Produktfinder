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

def main(prod_id: str):
    #prodId = 8200735

    product_url = 'https://www.obi.de/p/' + str(prod_id) #'https://www.obi.de/p/8200735/kuenstlicher-weihnachtsbaum-nagano-tannenbaum-180-cm-kunsttanne-gruen' #'https://www.obi.de/search/weihnachtsbaum/' 

    print(f"Fetching: {product_url}", file=sys.stderr)

    # 3) Fetch product page HTML
    prod = requests.get(
        product_url,
        headers=HEADERS,
        timeout=30,
        verify=CA_BUNDLE if CA_BUNDLE else VERIFY,
        proxies=PROXIES,
    )

    # 4) Print raw HTML to stdout
    result = re.search(r'bilder.obi.de(.*?)image.jpeg', prod.text)
    
    if result:
        print('https://bilder.obi.de'+result.group(1)+'image.jpeg')
    else:
        print("Title not found")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: python {sys.argv[0]} <prod_id_string>")
        sys.exit(1)

    # Extract the string argument
    input_string = sys.argv[1]

    # Call main with the provided string
    main(input_string)
