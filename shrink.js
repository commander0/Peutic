const fs = require('fs');
const path = 'c:/Users/LaVita Brooks/Downloads/peutic/components/Dashboard.tsx';
let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
for (let i = 670; i < 960; i++) {
    if (lines[i]) {
        lines[i] = lines[i].replace(/md:h-\[220px\]/g, 'md:h-[160px]')
            .replace(/md:p-6/g, 'md:p-4')
            .replace(/md:w-20 md:h-20/g, 'md:w-16 md:h-16')
            .replace(/md:w-10 md:h-10/g, 'md:w-7 md:h-7')
            .replace(/md:w-8 md:h-8/g, 'md:w-6 md:h-6');
    }
}
fs.writeFileSync(path, lines.join('\n'));
console.log('Shrunk tiles successfully!');
