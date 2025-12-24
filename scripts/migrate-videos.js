import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Vimeo } from '@vimeo/vimeo';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import async from 'async';
import axios from 'axios';
import { URL } from 'url';

// Initialize environment
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ffmpegPath = ffmpegInstaller.path;

// Configuration
const CONCURRENCY = 5; // User requested 5-10 parallel videos
const INPUT_FILE = path.join(__dirname, 'videos.txt');
const OUTPUT_LINKS_FILE = path.join(__dirname, 'migrated_links.txt');
const STATUS_FILE = path.join(__dirname, 'migration_status.json');
const TEMP_DIR = path.join(__dirname, 'temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}

// Initialize Vimeo client
const { VIMEO_CLIENT_ID, VIMEO_CLIENT_SECRET, VIMEO_ACCESS_TOKEN } = process.env;

if (!VIMEO_ACCESS_TOKEN || !VIMEO_CLIENT_ID || !VIMEO_CLIENT_SECRET) {
    console.error("Error: Vimeo credentials missing in .env file.");
    process.exit(1);
}

const client = new Vimeo(VIMEO_CLIENT_ID, VIMEO_CLIENT_SECRET, VIMEO_ACCESS_TOKEN);

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Helper to load status
function loadStatus() {
    if (fs.existsSync(STATUS_FILE)) {
        return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    }
    return {};
}

// Helper to save status
function saveStatus(status) {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
}

// Helper: Download a file
async function downloadFile(url, outputPath) {
    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream'
    });
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

// Helper: Fetch text content
async function fetchText(url) {
    const response = await axios.get(url);
    return response.data;
}

// Helper: Parse and Download HLS
async function downloadHlsSequence(masterUrl, videoId) {
    console.log(`[HLS] Analyzing ${masterUrl}`);
    let currentUrl = masterUrl;
    let content = await fetchText(currentUrl);

    // Check if master playlist
    if (content.includes('#EXT-X-STREAM-INF')) {
        console.log(`[HLS] Found master playlist, selecting best quality...`);
        const lines = content.split('\n');
        let bestUrl = null;
        let maxBandwidth = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('#EXT-X-STREAM-INF')) {
                // Parse bandwidth
                const match = line.match(/BANDWIDTH=(\d+)/);
                const bandwidth = match ? parseInt(match[1]) : 0;
                // Next line is the URL (ignoring comments/empty)
                let nextLineIdx = i + 1;
                while (nextLineIdx < lines.length && (lines[nextLineIdx].trim() === '' || lines[nextLineIdx].startsWith('#'))) {
                    nextLineIdx++;
                }
                if (nextLineIdx < lines.length) {
                    const relativeUrl = lines[nextLineIdx].trim();
                    if (bandwidth > maxBandwidth) {
                        maxBandwidth = bandwidth;
                        bestUrl = new URL(relativeUrl, currentUrl).href;
                    }
                }
            }
        }

        if (bestUrl) {
            console.log(`[HLS] Selected bandwidth ${maxBandwidth}: ${bestUrl}`);
            currentUrl = bestUrl;
            content = await fetchText(currentUrl);
        } else {
            throw new Error("Could not parse variant playlist");
        }
    }

    // Process Media Playlist
    const lines = content.split('\n');
    const segmentUrls = [];
    const workDir = path.join(TEMP_DIR, videoId);

    if (!fs.existsSync(workDir)) fs.mkdirSync(workDir);

    for (const line of lines) {
        const tLine = line.trim();
        if (tLine && !tLine.startsWith('#')) {
            segmentUrls.push(new URL(tLine, currentUrl).href);
        }
    }

    console.log(`[HLS] Found ${segmentUrls.length} segments.`);

    // Download Segments
    const segmentFiles = [];
    // Download in batches
    await async.eachLimit(segmentUrls, 5, async (segUrl) => { // 5 parallel segments per video
        const index = segmentUrls.indexOf(segUrl);
        const segPath = path.join(workDir, `${index}.ts`);
        segmentFiles[index] = segPath; // Keep order

        if (!fs.existsSync(segPath)) {
            // console.log(`[Downloading Segment] ${index}/${segmentUrls.length}`);
            try {
                await downloadFile(segUrl, segPath);
            } catch (e) {
                console.error(`Error downloading segment ${index}: ${e.message}`);
                throw e;
            }
        }
    });

    // Create Concat List
    const listPath = path.join(workDir, 'list.txt');
    const fileContent = segmentFiles.map(f => `file '${f}'`).join('\n');
    fs.writeFileSync(listPath, fileContent);

    // Merge
    const outputMp4 = path.join(TEMP_DIR, `${videoId}.mp4`);
    console.log(`[HLS] Merging to ${outputMp4}...`);

    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(listPath)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions('-c copy')
            .output(outputMp4)
            .on('end', () => {
                console.log(`[HLS] Merge complete.`);
                // Cleanup segments
                fs.rmSync(workDir, { recursive: true, force: true });
                resolve(outputMp4);
            })
            .on('error', (err) => {
                console.error(`[HLS] Merge failed:`, err);
                reject(err);
            })
            .run();
    });
}


// Helper: Upload to Vimeo
function uploadVideo(filePath, name) {
    return new Promise((resolve, reject) => {
        console.log(`[Upload Started] ${filePath}`);

        client.upload(
            filePath,
            {
                'name': name || 'Migrated Video',
                'privacy': {
                    'view': 'unlisted' // User requested unlisted
                }
            },
            (uri) => {
                console.log(`[Upload Complete] File: ${filePath}, URI: ${uri}`);
                const videoId = uri.split('/').pop();
                resolve(videoId);
            },
            (bytesUploaded, bytesTotal) => {
                const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
                if (Math.floor(percentage) % 10 === 0 && Math.floor(percentage) > 0) {
                    // verbose logging off
                }
            },
            (error) => {
                console.error(`[Upload Error] ${filePath}:`, error);
                reject(error);
            }
        );
    });
}

async function main() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`Error: ${INPUT_FILE} not found.`);
        process.exit(1);
    }

    const content = fs.readFileSync(INPUT_FILE, 'utf8');
    const lines = content.split('\n');
    const items = [];

    // Parse lines with format: ├  Title : ... | URL
    for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        let title = '';
        let url = '';

        if (cleanLine.startsWith('├')) {
            const parts = cleanLine.split('|');
            if (parts.length >= 2) {
                // Extract Title
                const titlePart = parts[0].replace('├', '').trim();
                if (titlePart.startsWith('Title :')) {
                    title = titlePart.replace('Title :', '').trim();
                } else if (titlePart.startsWith('Main Topic :')) {
                    title = titlePart.replace('Main Topic :', '').trim();
                } else {
                    title = titlePart.trim();
                }

                // Extract URL
                let rawUrl = parts[1].trim();

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
                    }
                } catch (e) {
                    console.warn(`[Parse Warning] Could not decode URL: ${rawUrl}`, e);
                }
            }
        } else {
            // Fallback for simple lines
            const parts = cleanLine.split(',');
            for (const part of parts) {
                const u = part.split('#')[0].trim(); // nested comment check
                if (u && u.startsWith('http')) {
                    url = u;
                    title = `Migrated Video ${Buffer.from(u).toString('base64').substring(0, 8)}`;
                }
            }
        }

        if (url && url.startsWith('http')) {
            items.push({ title, url });
        }
    }

    if (items.length === 0) {
        console.log("No URLs found in videos.txt");
        return;
    }

    console.log(`Found ${items.length} videos to process.`);
    const status = loadStatus();

    const task = async (item) => {
        const { url, title } = item;

        if (status[url] && status[url].state === 'completed') {
            console.log(`[Skipping] Already completed: ${title}`);
            return;
        }

        const videoId = Buffer.from(url).toString('base64').substring(0, 15).replace(/[^a-zA-Z0-9]/g, '');
        let localFile = path.join(TEMP_DIR, `${videoId}.mp4`);

        try {
            // Step A: Download
            let downloadNeeded = true;
            if (status[url] && status[url].state === 'downloaded' && fs.existsSync(status[url].localFile)) {
                console.log(`[Resume] Using existing file for ${url}`);
                localFile = status[url].localFile;
                downloadNeeded = false;
            }

            if (downloadNeeded) {
                status[url] = { state: 'downloading', timestamp: new Date().toISOString() };
                saveStatus(status);

                localFile = await downloadHlsSequence(url, videoId);

                status[url] = { state: 'downloaded', localFile: localFile, timestamp: new Date().toISOString() };
                saveStatus(status);
            }

            // Step B: Upload
            status[url].state = 'uploading';
            saveStatus(status);

            const vimeoId = await uploadVideo(localFile, title); // Use Title

            status[url] = {
                state: 'completed',
                vimeoId: vimeoId,
                title: title,
                timestamp: new Date().toISOString()
            };
            saveStatus(status);

            // Append to output file
            const linkEntry = `[${title}] ${url} -> https://vimeo.com/${vimeoId}\n`;
            fs.appendFileSync(OUTPUT_LINKS_FILE, linkEntry);
            console.log(`[Log] Saved link to migrated_links.txt`);

            // Step C: Cleanup
            if (fs.existsSync(localFile)) {
                fs.unlinkSync(localFile);
                console.log(`[Cleanup] Deleted local file: ${localFile}`);
            }

        } catch (err) {
            status[url] = {
                state: 'error',
                error: err.message,
                timestamp: new Date().toISOString()
            };
            saveStatus(status);
            console.error(`[Failed] Processing ${title} failed:`, err);
        }
    };

    const queue = async.queue(task, CONCURRENCY);
    items.forEach(item => queue.push(item));
    await queue.drain();
    console.log("All tasks processed.");
}

main().catch(console.error);
