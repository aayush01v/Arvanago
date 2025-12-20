import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to service key - ADJUST THIS PATH IF NEEDED OR USE ENV VAR
const serviceKeyPath = '/home/codespace/Downloads/Update/edusimulate-firestore-seed/serviceKey.json';

// Base URL
const BASE_URL = 'https://edusimulate.vercel.app';

async function generateSitemap() {
    console.log('Generating sitemap...');

    if (!fs.existsSync(serviceKeyPath)) {
        console.error(`Service key not found at ${serviceKeyPath}. Skipping sitemap generation.`);
        // Fallback: Generate basic sitemap without dynamic courses if keys are missing
        generateBasicSitemap();
        return;
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceKeyPath, 'utf8'));

    initializeApp({
        credential: cert(serviceAccount)
    });

    const db = getFirestore();
    const coursesSnapshot = await db.collection('courses').get();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Routes -->
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/explore</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${BASE_URL}/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <!-- Dynamic Course Routes -->`;

    coursesSnapshot.forEach(doc => {
        const courseId = doc.id;
        // const lastMod = doc.data().updatedAt ... // could parse this
        sitemap += `
  <url>
    <loc>${BASE_URL}/courses/${courseId}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    const publicDir = resolve(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }

    writeFileSync(resolve(publicDir, 'sitemap.xml'), sitemap);
    console.log(`Sitemap generated at ${resolve(publicDir, 'sitemap.xml')}`);

    updateRobotsTxt(publicDir);
}

function generateBasicSitemap() {
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/explore</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;
    const publicDir = resolve(__dirname, '../public');
    writeFileSync(resolve(publicDir, 'sitemap.xml'), sitemap);
    console.log('Generated basic sitemap (no courses).');
    updateRobotsTxt(publicDir);
}

function updateRobotsTxt(publicDir) {
    const robotsPath = resolve(publicDir, 'robots.txt');
    const robotsContent = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
    writeFileSync(robotsPath, robotsContent);
    console.log('Updated robots.txt');
}

generateSitemap().catch(console.error);
