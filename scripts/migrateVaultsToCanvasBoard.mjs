import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Run with: node scripts/migrateVaultsToCanvasBoard.mjs
// IMPORTANT: Ensure you have a serviceAccountKey.json in your project root before running.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keyPath = path.resolve(__dirname, '../serviceAccountKey.json');

try {
    const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
    initializeApp({
        credential: cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized.");
} catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    process.exit(1);
}

const db = getFirestore();

async function migrateVaults() {
    console.log("Starting Migration: Legacy Vaults/Notes to Native CanvasBoards");
    let migratedCount = 0;

    try {
        const usersSnapshot = await db.collection('users').get();
        console.log(`Found ${usersSnapshot.size} users. Processing...`);

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const vaultsRef = db.collection('users').doc(userId).collection('vaults');
            const notesRef = db.collection('users').doc(userId).collection('notes');
            const boardsRef = db.collection('users').doc(userId).collection('boards');
            
            const vaultsSnapshot = await vaultsRef.get();

            for (const vaultDoc of vaultsSnapshot.docs) {
                const vaultId = vaultDoc.id;
                const vaultData = vaultDoc.data();
                
                const notesSnapshot = await notesRef.where('vaultId', '==', vaultId).get();
                console.log(`Migrating Vault: ${vaultData.name} (${notesSnapshot.size} notes) for User: ${userId}`);
                
                const canvasNodes = [];
                let i = 0;
                const cols = 3;
                
                // Embed notes as text nodes
                for (const noteDoc of notesSnapshot.docs) {
                    const noteData = noteDoc.data();
                    const row = Math.floor(i / cols);
                    const col = i % cols;
                    
                    const textContent = `> [!cc-header]\n> ${noteData.title}\n\n${noteData.content}`;

                    canvasNodes.push({
                        id: noteDoc.id,
                        type: "text",
                        text: textContent,
                        x: col * 350,
                        y: row * 300,
                        width: 300,
                        height: Math.min(600, Math.max(250, textContent.split('\n').length * 20 + 50))
                    });
                    
                    i++;
                }

                const canvasData = {
                    nodes: canvasNodes,
                    edges: []
                };

                // Create the new CanvasBoard
                const timestamp = FieldValue.serverTimestamp();
                await boardsRef.doc(vaultId).set({
                    id: vaultId,
                    userId: userId,
                    name: vaultData.name,
                    description: vaultData.description || null,
                    canvasData: JSON.stringify(canvasData, null, 2),
                    isPublic: vaultData.isPublic || false,
                    createdAt: vaultData.createdAt || timestamp,
                    updatedAt: timestamp
                });

                migratedCount++;
                console.log(`✅ Converted Vault "${vaultData.name}" to CanvasBoard.`);

                // OPTIONAL: Delete old vault and notes after successful migration
                /*
                for (const noteDoc of notesSnapshot.docs) {
                    await notesRef.doc(noteDoc.id).delete();
                }
                await vaultsRef.doc(vaultId).delete();
                console.log(`🗑️ Deleted legacy Vault "${vaultData.name}" and its notes.`);
                */
            }
        }
        console.log(`\nMigration completed successfully. Migrated ${migratedCount} vaults to CanvasBoards.`);
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

migrateVaults().then(() => process.exit(0));
