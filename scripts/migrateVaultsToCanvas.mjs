import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Run with: node scripts/migrateVaultsToCanvas.mjs
// IMPORTANT: Ensure you have a serviceAccountKey.json in your project root before running.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keyPath = path.resolve(__dirname, '../serviceAccountKey.json');

try {
    const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized.");
} catch (error) {
    console.error("Failed to initialize Firebase Admin. Please ensure serviceAccountKey.json exists in the root directory.");
    process.exit(1);
}

const db = admin.firestore();

async function migrateVaults() {
    console.log("Starting Migration: Vaults to JSON Canvas");
    try {
        const usersSnapshot = await db.collection('users').get();
        console.log(`Found ${usersSnapshot.size} users. Processing...`);

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const vaultsRef = db.collection('users').doc(userId).collection('vaults');
            const notesRef = db.collection('users').doc(userId).collection('notes');
            
            const vaultsSnapshot = await vaultsRef.get();

            for (const vaultDoc of vaultsSnapshot.docs) {
                const vaultId = vaultDoc.id;
                const vaultData = vaultDoc.data();
                
                // Fetch all notes for this vault
                const notesSnapshot = await notesRef.where('vaultId', '==', vaultId).get();
                if (notesSnapshot.empty) continue; // Skip empty vaults
                
                console.log(`Migrating Vault: ${vaultData.name} (${notesSnapshot.size} notes) for User: ${userId}`);
                
                const canvasNodes = [];
                let i = 0;
                const cols = 3;
                
                // Convert notes to canvas nodes
                for (const noteDoc of notesSnapshot.docs) {
                    const noteData = noteDoc.data();
                    const row = Math.floor(i / cols);
                    const col = i % cols;
                    
                    canvasNodes.push({
                        id: noteDoc.id,
                        type: "file",
                        file: noteData.title, // Reference the note by title for the UI to resolve
                        x: col * 350,
                        y: row * 300,
                        width: 300,
                        height: 250
                    });
                    
                    i++;
                }

                const canvasData = {
                    nodes: canvasNodes,
                    edges: []
                };

                // Save the generated Canvas as a new Master Note inside the vault
                const canvasNoteId = `canvas-${vaultId}`;
                await notesRef.doc(canvasNoteId).set({
                    id: canvasNoteId,
                    userId: userId,
                    vaultId: vaultId,
                    title: `${vaultData.name} Board.canvas`,
                    content: JSON.stringify(canvasData, null, 2),
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    isPublic: false
                });

                console.log(`✅ Created ${vaultData.name} Board.canvas`);
            }
        }
        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

migrateVaults().then(() => process.exit(0));
