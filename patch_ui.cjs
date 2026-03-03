const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'components');

const replaceRules = [
    { search: /rounded-\[2rem\]/g, replace: 'rounded-xl' },
    { search: /rounded-3xl/g, replace: 'rounded-xl' },
    { search: /rounded-2xl/g, replace: 'rounded-xl' },
    { search: /shadow-premium/g, replace: 'shadow-sm' },
    { search: /shadow-glass-dark/g, replace: 'shadow-sm' },
    { search: /shadow-glass/g, replace: 'shadow-sm' },
    { search: /shadow-inner-glow/g, replace: 'shadow-sm' },
    { search: /shadow-ethereal-glow/g, replace: 'shadow-sm' },
    { search: /shadow-\[0_20px_40px_-15px_rgba\(0,0,0,0\.1\)\]/g, replace: 'shadow-md' },
    { search: /shadow-\[0_30px_60px_-15px_rgba\(0,0,0,0\.5\)\]/g, replace: 'shadow-lg' },
    { search: /focus:ring-yellow-400/g, replace: 'focus:ring-primary/20' },
    { search: /focus:border-yellow-400/g, replace: 'focus:border-primary' },
    { search: /focus:border-yellow-500/g, replace: 'focus:border-primary' },
];

function processDirectory(directory) {
    if (!fs.existsSync(directory)) return;
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            for (const rule of replaceRules) {
                content = content.replace(rule.search, rule.replace);
            }

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${file}`);
            }
        }
    }
}

processDirectory(componentsDir);
console.log('UI Patch complete.');
