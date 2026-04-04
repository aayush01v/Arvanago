/**
 * Local dev API server — runs on port 3001
 * Vite proxies /api/* requests here during `npm run dev`
 *
 * Run with: node scripts/dev-server.mjs
 */

import http from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from project root
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

// Dynamically import the handlers (they use ES module exports)
const { default: createOrderHandler } = await import('../api/create-order.js');
const { default: verifyPaymentHandler } = await import('../api/verify-payment.js');

const PORT = 3002;

function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch { resolve({}); }
        });
    });
}

function makeRes(res) {
    const headers = {};
    return {
        status(code) {
            res.statusCode = code;
            return this;
        },
        setHeader(key, value) {
            headers[key] = value;
            res.setHeader(key, value);
            return this;
        },
        json(data) {
            res.setHeader('Content-Type', 'application/json');
            // CORS for localhost dev
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(data));
        }
    };
}

const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.writeHead(204);
        res.end();
        return;
    }

    const body = await parseBody(req);
    const fakeReq = { method: req.method, body, headers: req.headers };
    const fakeRes = makeRes(res);

    const url = req.url.split('?')[0];

    if (url === '/api/create-order') {
        return createOrderHandler(fakeReq, fakeRes);
    }
    if (url === '/api/verify-payment') {
        return verifyPaymentHandler(fakeReq, fakeRes);
    }

    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
    console.log(`\n  🚀 Local API server running at http://localhost:${PORT}`);
    console.log(`  Handles: /api/create-order, /api/verify-payment\n`);
});
