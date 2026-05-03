import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlFilePath = path.join(__dirname, 'Maths Spl-33 (Pre+Mains)_Gagan Pratap Sir_notes_and_videos.html');
const outputFilePath = path.join(__dirname, '../src/data/migrated_course.json');

// Ensure output dir exists
const outputDir = path.dirname(outputFilePath);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

try {
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

    // --- PARSE VIDEOS ---
    // Regex for: playVideo('URL')">Title</a>
    const videoRegex = /onclick="playVideo\('([^']+)'\)">([^<]+)<\/a>/g;
    let match;
    const lectures = [];
    const videosBySection = {};

    while ((match = videoRegex.exec(htmlContent)) !== null) {
        const url = match[1];
        let title = match[2].trim();

        // Extract Section from Title
        // Common formats: "Class-01 | Percentage", "Class-01 || Percentage"
        let sectionTitle = 'General';
        let lectureTitle = title;

        const separatorRegex = /\s*\|\|\s*|\s*\|\s*/;
        const parts = title.split(separatorRegex);

        if (parts.length > 1) {
            // Usually the last part is the topic/section
            // e.g. ["Arithmetic - Class-01", "Percentage"]
            // Sometimes it's ["Arithmetic - Class-10", "Maths", "Ratio and Proportion"] -> Last one is likeliest section
            sectionTitle = parts[parts.length - 1].trim();
            lectureTitle = parts.slice(0, parts.length - 1).join(' - ').trim(); // Rejoin rest
        }

        // Clean up title
        // Remove "Arithmetic - " or "Advance - " preamble if it's redundant with section? 
        // For now, keep it mostly as is but strip common prefixes if needed.
        // Actually, user said "lossless" so let's keep full title as the lecture title, 
        // but use the extracted part for grouping.

        if (!videosBySection[sectionTitle]) {
            videosBySection[sectionTitle] = [];
        }

        videosBySection[sectionTitle].push({
            id: `lecture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: title, // Keep original full title
            duration: '00:00', // Placeholder
            videoUrl: url,
            isCompleted: false,
            summary: '',
            isPreview: false
        });
    }

    // Convert grouped videos to Sections
    const sections = Object.keys(videosBySection).map(sectionTitle => ({
        title: sectionTitle,
        lectures: videosBySection[sectionTitle]
    }));

    // --- PARSE PDFS ---
    // Regex for: href="URL" target="_blank">Title</a>
    // Note: The file has PDFs in a div id="pdfs"
    const pdfRegex = /href="([^"]+)" target="_blank">([^<]+)<\/a>/g;
    const resources = [];

    // We only want PDFs from the pdf-list div ideally, but the regex is specific enough to links 
    // inside the file. However, verify if there are other links. 
    // The previous analysis showed they are grouped in <div class="pdf-list">.
    // Let's just grab all links that look like resources (target="_blank" usually indicates external resource here)

    while ((match = pdfRegex.exec(htmlContent)) !== null) {
        const url = match[1];
        const title = match[2].trim();

        // Basic check to see if it's likely a resource link
        if (url.includes('.pdf') || url.includes('drive.google') || title.toLowerCase().includes('sheet') || title.toLowerCase().includes('notes')) {
            resources.push({
                id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: title,
                type: 'PDF',
                size: 'Unknown',
                url: url
            });
        }
    }

    // --- CONSTRUCT COURSE OBJECT ---
    const course = {
        id: 'maths-spl-33-migrated', // Fixed ID for now
        title: 'Maths Spl-33 (Pre+Mains) - Gagan Pratap Sir',
        description: 'Migrated course content including Arithmetic and Advance Maths.',
        longDescription: 'Comprehensive Maths course for Pre+Mains exams. Includes detailed video lectures and PDF resources.',
        thumbnail: '', // Placeholder
        isFree: false,
        isPaid: true,
        isPublished: false, // Draft mode
        lectures: [], // Flat list? Interface has sections mostly.
        sections: sections,
        progress: 0,
        author: {
            uid: 'migration-script',
            name: 'System Migrator',
            email: 'admin@example.com',
            avatar: '',
            level: 1,
            points: 0,
            streak: 0,
            completedChallenges: 0,
            enrolledCourses: [],
            ongoingCourses: [],
            wishlist: [],
            pendingTasks: [],
            followers: 0,
            following: 0,
            postsCount: 0
        },
        price: 0,
        currency: 'INR',
        tags: ['Maths', 'Competitive Exams', 'Pre+Mains'],
        resources: resources,
        simulations: []
    };

    fs.writeFileSync(outputFilePath, JSON.stringify(course, null, 2));
    console.log(`Successfully migrated course!`);
    console.log(`- output: ${outputFilePath}`);
    console.log(`- sections: ${sections.length}`);
    console.log(`- total lectures: ${sections.reduce((acc, s) => acc + s.lectures.length, 0)}`);
    console.log(`- resources: ${resources.length}`);

} catch (error) {
    console.error('Migration failed:', error);
}
