import json
import urllib.request
import urllib.parse
import urllib.error

URL = "https://qdnctbupmlqhzubwigjn.supabase.co/rest/v1/companions"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmN0YnVwbWxxaHp1YndpZ2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTQ0MjEsImV4cCI6MjA3Njk5MDQyMX0.kwfDMX0cGOQ3embdFnQnMNJT27CKi8Krf_Ew8uPgLrU"

req = urllib.request.Request(f"{URL}?select=*", headers={
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Range": "0-100"
})

output = []

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        
        output.append(f"Total companions in live DB: {len(data)}")

        danny = [c for c in data if c['name'].lower() == 'danny']
        output.append(f"Danny: {json.dumps(danny)}")

        womens = [c for c in data if 'women' in c['specialty'].lower()]
        output.append(f"Women's Health: {json.dumps(womens)}")

        # Check URL validity
        bad_urls = []
        for c in data:
            img_url = c.get('image_url')
            if img_url:
                try:
                    img_req = urllib.request.Request(img_url, method='HEAD')
                    urllib.request.urlopen(img_req, timeout=5)
                except urllib.error.HTTPError as e:
                    if e.code != 403: # Unsplash sometimes blocks HEAD with 403
                        bad_urls.append(f"{c['name']}: {img_url} ({e.code})")
                except Exception as e:
                    bad_urls.append(f"{c['name']}: {img_url} ({e})")
            else:
                 bad_urls.append(f"{c['name']}: MISSING")

        output.append(f"Bad URLs: {bad_urls}")

    with open('db_report.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(output))
        
except Exception as e:
    print(e)
