import urllib.request
import json

URL = "https://qdnctbupmlqhzubwigjn.supabase.co/rest/v1/companions"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmN0YnVwbWxxaHp1YndpZ2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTQ0MjEsImV4cCI6MjA3Njk5MDQyMX0.kwfDMX0cGOQ3embdFnQnMNJT27CKi8Krf_Ew8uPgLrU"

# We must double up braces in f-strings where we want literal braces in the output string
# But for json.dumps, we just insert the evaluated JSON directly as a string
updates_json = [{"id": "c36", "specialty": "Financial Therapy"}, {"id": "c37", "specialty": "Racial Identity"}, {"id": "c38", "specialty": "Climate Anxiety"}, {"id": "c39", "specialty": "Chronic Illness"}, {"id": "c40", "specialty": "Empty Nest Transition"}, {"id": "c41", "specialty": "Religious Trauma"}, {"id": "c42", "specialty": "Complex PTSD"}, {"id": "c43", "specialty": "Blended Families"}, {"id": "c44", "specialty": "Polyamory Dynamics"}, {"id": "c45", "specialty": "First-Gen College"}, {"id": "c46", "specialty": "Infertility & Loss"}, {"id": "c47", "specialty": "Body Dysmorphia"}, {"id": "c48", "specialty": "Career Pivot Strategy"}, {"id": "c49", "specialty": "Quarter-Life Crisis"}, {"id": "c50", "specialty": "Expat Adjustment"}]

print("Starting DB Update...")
success = 0
for u in updates_json:
    req = urllib.request.Request(f"{URL}?id=eq.{u['id']}", method='PATCH', headers={
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }, data=json.dumps({"specialty": u['specialty']}).encode('utf-8'))
    
    try:
        urllib.request.urlopen(req)
        print(f"[{u['id']}] Changed to: {u['specialty']}")
        success += 1
    except Exception as e:
        print(f"Failed {u['id']}: {e}")
        
print(f"Successfully updated {success}/{len(updates_json)} companions in live database.")
