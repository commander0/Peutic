import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'components');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let modifiedFiles = 0;

walkDir(componentsDir, function (filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf-8');
        let original = content;

        // 1. Deflate massive radiuses
        content = content.replace(/\brounded-3xl\b/g, 'rounded-xl');
        content = content.replace(/\brounded-2xl\b/g, 'rounded-lg');

        // 2. Strip scattered neon dropshadows
        // Matches shadow-[0_0_*] including all rgb/rgba variations
        content = content.replace(/\bshadow-\[0_0_[^\]]+\]/g, 'shadow-sm');

        // 3. Strip equivalent drop-shadows
        content = content.replace(/\bdrop-shadow-\[0_0_[^\]]+\]/g, 'drop-shadow-sm');

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf-8');
            modifiedFiles++;
            console.log(`Patched: ${path.relative(process.cwd(), filePath)}`);
        }
    }
});

console.log(`V3 Migration Complete. Modified ${modifiedFiles} files.`);
