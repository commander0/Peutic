import json
import re

with open('mapping.json', 'r', encoding='utf-8') as f:
    mappings = json.load(f)

print(f"Loaded {len(mappings)} mappings to update locally.")

def update_file(filepath):
    print(f"Processing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    updates = 0
    for m in mappings:
        cid = m['id']
        old_spec = m['old_specialty']
        new_spec = m['new_specialty']
        
        # Regex to find the id block and replace the specialty within that same block
        # For seed_companions.sql: ('c42', '...', '...', 'Eating Disorders', ...)
        # For database.ts: { id: 'c42', ..., specialty: 'Eating Disorders', ... }
        
        # This is tricky because we only want to replace the specialty for specifically THIS id.
        # We can use a regex that matches the ID, then scans forward to the old specialty string.
        
        # For SQL: match `('cid', ...` up to `'old_spec'`
        pattern_sql = r"(\('" + cid + r"'.*?)'" + re.escape(old_spec) + r"'"
        content, c1 = re.subn(pattern_sql, r"\1'" + new_spec + r"'", content)
        
        # For TS: match `id: 'cid', ...` up to `specialty: 'old_spec'`
        pattern_ts = r"(id:\s*'" + cid + r"'.*?specialty:\s*')" + re.escape(old_spec) + r"'"
        content, c2 = re.subn(pattern_ts, r"\1" + new_spec + r"'", content)
        
        if c1 > 0 or c2 > 0:
            updates += 1
            print(f"  Fixed {cid}: -> {new_spec}")
        else:
            print(f"  WARNING: Could not find/replace {cid} {old_spec}")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Completed {updates} updates in {filepath}\n")

update_file('supabase/seed_companions.sql')
update_file('services/database.ts')

print("Local codebase synced.")
