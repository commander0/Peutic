import json
import urllib.request
import urllib.parse

URL = "https://qdnctbupmlqhzubwigjn.supabase.co/rest/v1/companions"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmN0YnVwbWxxaHp1YndpZ2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTQ0MjEsImV4cCI6MjA3Njk5MDQyMX0.kwfDMX0cGOQ3embdFnQnMNJT27CKi8Krf_Ew8uPgLrU"

req = urllib.request.Request(f"{URL}?select=*", headers={
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Range": "0-100"
})

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        
        print(f"Total companions in live DB: {len(data)}")

        danny = [c for c in data if c['name'].lower() == 'danny']
        print(f"Danny: {json.dumps(danny, indent=2)}")

        womens = [c for c in data if 'women' in c['specialty'].lower()]
        print(f"Women's Health: {json.dumps(womens, indent=2)}")

        missing_img = [c for c in data if not c.get('image_url') or 'http' not in c['image_url']]
        print(f"Missing images count: {len(missing_img)}")
except Exception as e:
    print(e)
