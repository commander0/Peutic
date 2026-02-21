import urllib.request
import urllib.parse
import json

URL = "https://qdnctbupmlqhzubwigjn.supabase.co/rest/v1/companions"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmN0YnVwbWxxaHp1YndpZ2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTQ0MjEsImV4cCI6MjA3Njk5MDQyMX0.kwfDMX0cGOQ3embdFnQnMNJT27CKi8Krf_Ew8uPgLrU"

# Pool of safe, tested Unsplash photo IDs (Females)
candidates_f = [
    "1534528741775-53994a69daeb",
    "1580489944761-15a19d654956",
    "1502823403499-6ccfcf4fb453",
    "1494790108377-be9c29b29330",
    "1544005313-94ddf0286df2",
    "1438761681033-6461ffad8d80"
]

# Pool of safe, tested Unsplash photo IDs (Males)
candidates_m = [
    "1500648767791-00dcc994a43e",
    "1506794778202-cad84cf45f1d",
    "1519085360753-af0119f7cbe7",
    "1539571696357-5a69c17a67c6",
    "1472099645785-5658abf4ff4e"
]

def check_url(photo_id):
    url = f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&q=80&w=800"
    try:
        req = urllib.request.Request(url, method='HEAD')
        res = urllib.request.urlopen(req, timeout=5)
        return url if res.status == 200 else None
    except Exception:
        return None

def update_companion(comp_id, img_url):
    req = urllib.request.Request(f"{URL}?id=eq.{comp_id}", method='PATCH', headers={
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }, data=json.dumps({"image_url": img_url}).encode('utf-8'))
    
    try:
        urllib.request.urlopen(req)
        print(f"Updated {comp_id} with {img_url}")
    except Exception as e:
        print(f"Failed to update {comp_id}: {e}")

# Find 3 valid females
valid_f = []
for cid in candidates_f:
    url = check_url(cid)
    if url: valid_f.append(url)
    if len(valid_f) == 3: break

# Find 1 valid male
valid_m = []
for cid in candidates_m:
    url = check_url(cid)
    if url: valid_m.append(url)
    if len(valid_m) == 1: break

# The mappings to update
# c38 Maria (Female), c42 Gabby(Female), c36 Celine(Female)
# c41 Danny (Male)

updates = [
    ("c38", valid_f[0]),
    ("c42", valid_f[1]),
    ("c36", valid_f[2]),
    ("c41", valid_m[0])
]

print("Applying DB Updates...")
for uid, url in updates:
    update_companion(uid, url)

