import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, 'migrated_links.txt');
const OUTPUT_FILE = path.join(__dirname, '../pages/previewVideos.ts');

if (!fs.existsSync(INPUT_FILE)) {
    console.error("migrated_links.txt not found");
    process.exit(1);
}

const content = fs.readFileSync(INPUT_FILE, 'utf8');
const lines = content.split('\n');
const videos = [];

for (const line of lines) {
    const match = line.match(/^\[(.*?)\] .* -> https:\/\/vimeo\.com\/(.*)$/);
    if (match) {
        videos.push({
            title: match[1],
            id: match[2],
            url: `https://vimeo.com/${match[2]}`
        });
    }
}

const tsContent = `export const PREVIEW_VIDEOS = ${JSON.stringify(videos, null, 2)};`;

fs.writeFileSync(OUTPUT_FILE, tsContent);
console.log(`Generated ${videos.length} videos in ${OUTPUT_FILE}`);
