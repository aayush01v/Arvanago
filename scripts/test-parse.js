import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { URL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, 'links_stable.txt');
const content = fs.readFileSync(INPUT_FILE, 'utf8');
const lines = content.split('\n');
const items = [];
const warnings = [];

// Parse lines with format: ├  Title : ... | URL
for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;

    let title = '';
    let url = '';

    if (cleanLine.startsWith('├')) {
        const parts = cleanLine.split('|');
        if (parts.length >= 2) {
            // Extract URL from the LAST part (handles lines with multiple pipes)
            let rawUrl = parts[parts.length - 1].trim();

            // Extract Title from all parts EXCEPT the last one
            const titlePart = parts.slice(0, -1).join('|').replace('├', '').trim();
            if (titlePart.startsWith('Title :')) {
                title = titlePart.replace('Title :', '').trim();
            } else if (titlePart.startsWith('Main Topic :')) {
                title = titlePart.replace('Main Topic :', '').trim();
            } else if (titlePart.startsWith('𝖳𝗂𝗍𝗅𝖾 :')) {
                // Handle special Unicode title format
                title = titlePart.replace('𝖳𝗂𝗍𝗅𝖾 :', '').trim();
            } else {
                title = titlePart.trim();
            }

            // Decode nested params
            try {
                // Keep decoding until no more videoUrl params or we hit a limit
                let decoded = rawUrl;
                let depth = 0;
                while (decoded.includes('videoUrl=') && depth < 5) {
                    const u = new URL(decoded);
                    const next = u.searchParams.get('videoUrl');
                    if (next) {
                        decoded = next;
                    } else {
                        break;
                    }
                    depth++;
                }
                // Ensure it's a valid url
                if (decoded.startsWith('http')) {
                    url = decoded;
                } else {
                    warnings.push(`Line: ${cleanLine.substring(0, 60)}... - Decoded URL doesn't start with http: ${decoded.substring(0, 50)}`);
                }
            } catch (e) {
                warnings.push(`Line: ${cleanLine.substring(0, 60)}... - Parse error: ${e.message}`);
            }
        } else {
            warnings.push(`Line: ${cleanLine.substring(0, 60)}... - No pipe separator found`);
        }
    }

    if (url && url.startsWith('http')) {
        items.push({ title, url });
    } else if (cleanLine.startsWith('├')) {
        warnings.push(`Line: ${cleanLine.substring(0, 60)}... - No valid URL extracted`);
    }
}

console.log(`\n=== PARSING RESULTS ===`);
console.log(`Total lines in file: ${lines.length}`);
console.log(`Successfully parsed: ${items.length}`);
console.log(`Warnings: ${warnings.length}\n`);

if (warnings.length > 0) {
    console.log(`=== WARNINGS ===`);
    warnings.forEach((w, i) => console.log(`${i + 1}. ${w}`));
    console.log();
}

console.log(`=== SAMPLE PARSED ITEMS (first 5) ===`);
items.slice(0, 5).forEach((item, i) => {
    console.log(`${i + 1}. Title: ${item.title.substring(0, 50)}...`);
    console.log(`   URL: ${item.url}`);
});
