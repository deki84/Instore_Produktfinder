import pandas as pd

import sys
import requests
import re

import urllib3

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

# Read Excel file
df = pd.read_csv('C:\\NavarroProgs\\AI-Thon\\ObiSearch\\ArtikelNummerLagerplatz.csv',
                sep=';',
                dtype=str,
                encoding='cp1252')

# # Loop over and print each value
#for value in df['Art_Nr'][:10]:
     #print(value)

# Initialize the new column
#df['Art_Nr_with_extra'] = ""  # empty column

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


# Loop over rows and add a different string
for i in range(min(10, len(df))): #len(df)):  #
    product_id = str(df.loc[i, 'Art_Nr'])
    product_url = 'https://www.obi.de/p/' + product_id

    # Fetch product page HTML

    #resp = requests.get("https://www.obi.de/p/1041078", verify=False)
    prod = requests.get(
        product_url,
        headers=HEADERS,
        verify=False
    )
    # prod = requests.get(
    #     product_url,
    #     headers=HEADERS,
    #     timeout=30,
    #     verify=CA_BUNDLE if CA_BUNDLE else VERIFY,
    #     proxies=PROXIES,
    # )

    product_image_name = re.search(r'bilder.obi.de(.*?)image.jpeg', prod.text)
    
    if product_image_name:
        product_image_url = 'https://bilder.obi.de'+product_image_name.group(1)+'image.jpeg'
        df.loc[i, 'Art_Nr_Image_URL'] = product_image_url 
    else:
        df.loc[i, 'Art_Nr_Image_URL'] = "Image URL not found"

# Check first 10 rows
print(df[['Art_Nr', 'Art_Nr_Image_URL']].head(10))

df.to_csv(
    r'C:\NavarroProgs\AI-Thon\ObiSearch\ArtikelNummerLagerplatzWImageURLs.csv',
    index=False,
    encoding='cp1252'
)

