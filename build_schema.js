import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptsDir = path.join(__dirname, 'database', 'scripts');
const outputFile = path.join(__dirname, 'database', 'FULL_RESTORATION_SCHEMA.sql');

// Ordered list to ensure dependencies are respected and fixes apply cleanly
const filesToStitch = [
    'unified_schema.sql',
    'sanctuary_update.sql',
    'fix_rls.sql',
    'fix_data_persistence.sql',
    'fix_admin_permissions.sql',
    'fix_achievements_schema.sql',
    'add_dashboard_broadcast.sql',
    'fix_lumina_access.sql',
    '100_launch_indexes.sql',
    '101_strict_rls_users.sql',
    '102_garden_focus_minutes.sql',
    'seed_companions.sql',
    'seed_achievements.sql'
];

let finalSql = `-- ==============================================================================
-- PEUTIC OS: FULL RESTORATION SCHEMA (v4.0)
-- Automatically stitched together from all baseline and patch scripts.
-- Execution Order: Baseline -> RLS Fixes -> Patches -> Launch Indexes -> Seed Data
-- ==============================================================================

`;

for (const file of filesToStitch) {
    const filePath = path.join(scriptsDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`Reading ${file}...`);
        const content = fs.readFileSync(filePath, 'utf8');
        finalSql += `\n\n-- ==========================================\n`;
        finalSql += `-- SOURCE: ${file}\n`;
        finalSql += `-- ==========================================\n\n`;
        finalSql += content;
    } else {
        console.warn(`WARNING: File not found - ${file}`);
    }
}

fs.writeFileSync(outputFile, finalSql, 'utf8');
console.log(`\nSuccessfully saved to ${outputFile}`);
