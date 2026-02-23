import re
import json
import random

# Read the TS file
with open('services/database.ts', 'r', encoding='utf-8') as f:
    ts_content = f.read()

# Extract the INITIAL_COMPANIONS array
array_match = re.search(r'export const INITIAL_COMPANIONS: Companion\[\] = \[(.*?)\];', ts_content, re.DOTALL)

if not array_match:
    print("Could not find INITIAL_COMPANIONS block.")
    exit(1)

array_str = array_match.group(1)

companions = []
for line in array_str.split('\n'):
    if '{ id:' in line:
        id_match = re.search(r"id: '([^']+)'", line)
        name_match = re.search(r"name: '([^']+)'", line)
        spec_match = re.search(r"specialty: '([^']+)'", line)
        
        if id_match and name_match and spec_match:
            companions.append({
                'id': id_match.group(1),
                'name': name_match.group(1),
                'specialty': spec_match.group(1)
            })

seen_specialties = set()
duplicates = []

for comp in companions:
    spec = comp['specialty']
    if spec in seen_specialties:
        duplicates.append(comp)
    else:
        seen_specialties.add(spec)

print(f"Total companions parsed: {len(companions)}")
print(f"Unique primary specialties: {len(seen_specialties)}")
print(f"Duplicates found: {len(duplicates)}")

novel_specialties = [
    "Neurodivergent Coaching", "Autism Spectrum", "Highly Sensitive Persons", 
    "Gifted Adult Transitions", "TBI Recovery",
    "Complex PTSD", "Religious Trauma", "Medical Trauma",
    "Ambiguous Grief", "Infertility & Loss", "Climate Anxiety",
    "Polyamory Dynamics", "Blended Families", "Narcissistic Abuse",
    "Racial Identity", "First-Gen College",
    "Expat Adjustment", "Perfectionism Coaching", 
    "Orthorexia Support", "Financial Therapy", 
    "Creative Block", "Quarter-Life Crisis", 
    "Empty Nest Transition", "Entrepreneurial Stress",
    "Academic Burnout", "Body Dysmorphia", 
    "Chronic Illness", "Menopause Wellness", 
    "Music Therapy", "Career Pivot Strategy"
]

random.seed(42) # repeatable
random.shuffle(novel_specialties)

updates = []
for i, d in enumerate(duplicates):
    if i < len(novel_specialties):
        new_spec = novel_specialties[i]
        updates.append({
            'id': d['id'],
            'name': d['name'],
            'old_specialty': d['specialty'],
            'new_specialty': new_spec
        })

print("\n--- Proposed Duplicate Replacements ---")
for u in updates:
    print(f"{u['name']:<10} ({u['id']}): {u['old_specialty']:<25} -> {u['new_specialty']}")

db_script = f"""import urllib.request
import json

URL = "https://qdnctbupmlqhzubwigjn.supabase.co/rest/v1/companions"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmN0YnVwbWxxaHp1YndpZ2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTQ0MjEsImV4cCI6MjA3Njk5MDQyMX0.kwfDMX0cGOQ3embdFnQnMNJT27CKi8Krf_Ew8uPgLrU"

# We must double up braces in f-strings where we want literal braces in the output string
# But for json.dumps, we just insert the evaluated JSON directly as a string
updates_json = {json.dumps([{'id': u['id'], 'specialty': u['new_specialty']} for u in updates])}

print("Starting DB Update...")
success = 0
for u in updates_json:
    req = urllib.request.Request(f"{{URL}}?id=eq.{{u['id']}}", method='PATCH', headers={{
        "apikey": KEY,
        "Authorization": f"Bearer {{KEY}}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }}, data=json.dumps({{"specialty": u['specialty']}}).encode('utf-8'))
    
    try:
        urllib.request.urlopen(req)
        print(f"[{{u['id']}}] Changed to: {{u['specialty']}}")
        success += 1
    except Exception as e:
        print(f"Failed {{u['id']}}: {{e}}")
        
print(f"Successfully updated {{success}}/{{len(updates_json)}} companions in live database.")
"""

with open('patch_specialties.py', 'w', encoding='utf-8') as f:
    f.write(db_script)

with open('mapping.json', 'w', encoding='utf-8') as f:
    json.dump(updates, f, indent=4)
