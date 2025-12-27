import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { createNoteInVault, createVault, getNotesForVault, getUserVaults, deleteNote, updateNote, updateVault, deleteVault } from '../services/firestoreService';
import { Note, Vault } from '../types';
import Icon from '../components/common/Icon';
import FileExplorer from '../components/FileExplorer';
import CanvasRenderer from '../components/CanvasRenderer';
import MarkdownPreview from '../components/MarkdownPreview';
import { Helmet } from 'react-helmet-async';
import JSZip from 'jszip';
import { uploadToImgBB } from '../utils/uploadToImgBB';

const MyNotesPage: React.FC = () => {
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const vaultId = searchParams.get('vaultId');
    const navigate = useNavigate();

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const viewerRef = useRef<HTMLDivElement>(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        import('../services/firebase').then(({ auth }) => {
            const unsubscribe = auth.onAuthStateChanged(user => {
                if (user) {
                    setCurrentUserId(user.uid);
                } else {
                    setLoading(false);
                }
            });
            return () => unsubscribe();
        });
    }, []);

    useEffect(() => {
        if (!currentUserId) return;

        const loadVaults = async () => {
            setLoading(true);
            try {
                const userVaults = await getUserVaults(currentUserId);
                setVaults(userVaults);
            } catch (err) {
                console.error("Failed to load vaults", err);
            } finally {
                setLoading(false);
            }
        };
        loadVaults();
    }, [currentUserId]);

    useEffect(() => {
        if (!currentUserId || !vaultId) {
            setNotes([]);
            return;
        }

        const loadNotes = async () => {
            setLoading(true);
            try {
                const vaultNotes = await getNotesForVault(currentUserId, vaultId);
                setNotes(vaultNotes);
            } catch (err) {
                console.error("Failed to load notes", err);
            } finally {
                setLoading(false);
            }
        };
        loadNotes();
    }, [currentUserId, vaultId]);

    const handleCreateVault = async () => {
        if (!currentUserId) return;
        const name = prompt("Enter Vault Name:");
        if (!name) return;

        try {
            await createVault(currentUserId, name);
            // Refresh
            const userVaults = await getUserVaults(currentUserId);
            setVaults(userVaults);
        } catch (err: any) {
            console.error(err);
            alert(`Failed to create vault: ${err.message || 'Unknown error'}`);
        }
    };

    const activeVault = vaults.find(v => v.id === vaultId);

    const handleNavigate = (pathOrTitle: string) => {
        if (!pathOrTitle) return;
        let target = pathOrTitle.replace(/\[\[|\]\]/g, '');
        let note = notes.find(n => n.title === target || n.title === target + '.md' || n.title === target + '.canvas');
        if (!note) {
            note = notes.find(n => n.title.replace(/\.(md|canvas|txt)$/, '') === target);
        }
        if (!note) {
            note = notes.find(n => n.path && (n.path === target || n.path.endsWith('/' + target)));
        }

        if (note) {
            setSelectedNote(note);
        } else {
            console.warn("Note not found:", target);
            alert(`Note not found: ${target}`);
        }
    };

    const handleSaveCanvas = async (newContent: string) => {
        if (!currentUserId || !selectedNote) return;

        // Optimistic UI update
        const updated = { ...selectedNote, content: newContent };
        setSelectedNote(updated); // Update the viewer
        setNotes(prev => prev.map(n => n.id === updated.id ? updated : n)); // Update the list

        // Debounced save could be better, but direct save for now
        try {
            await updateNote(currentUserId, selectedNote.id, { content: newContent });
        } catch (err) {
            console.error("Failed to save canvas", err);
        }
    };
    const importTemplate = async () => {
        if (!currentUserId) return;
        setImporting(true);
        try {
            const response = await fetch('/templates/Engineering-Maths.zip');
            if (!response.ok) throw new Error("Failed to fetch template");
            const blob = await response.blob();

            const zip = await JSZip.loadAsync(blob);

            // Process files
            const promises: Promise<void>[] = [];

            // Create Vault
            const vault = await createVault(currentUserId, "Engineering Maths", "Sequence and Series");

            zip.forEach((relativePath, zipEntry) => {
                if (zipEntry.dir) return;
                if (relativePath.includes('__MACOSX') || relativePath.split(/[/\\]/).some(p => p.startsWith('.'))) return;

                // Normalize Path
                const normalizedPath = relativePath.replace(/\\/g, '/');

                // Collect CSS
                if (relativePath.endsWith('.css')) {
                    promises.push(
                        zipEntry.async("string").then(async (content) => {
                            console.log(`Found CSS: ${relativePath}`);
                            // Save CSS to vault
                            await updateVault(currentUserId, vault.id, { css: content });
                        })
                    );
                    return;
                }

                // Clean paths (remove top folder if exists)
                const parts = normalizedPath.split('/');
                const cleanPath = parts.length > 1 ? parts.slice(1).join('/') : normalizedPath;
                if (!cleanPath) return;

                const ext = cleanPath.split('.').pop()?.toLowerCase();
                if (!ext) return;

                // Process Text Files
                if (['md', 'canvas', 'txt'].includes(ext)) {
                    promises.push(
                        zipEntry.async("string").then(async (content) => {
                            const title = cleanPath.split('/').pop() || cleanPath;
                            const path = cleanPath.includes('/') ? cleanPath.substring(0, cleanPath.lastIndexOf('/')) : '';
                            await createNoteInVault(currentUserId, vault.id, title, content, path);
                        })
                    );
                }
            });

            await Promise.all(promises);

            // Refresh vaults
            const userVaults = await getUserVaults(currentUserId);
            setVaults(userVaults);
            // Navigate to new vault
            setSearchParams({ vaultId: vault.id });

        } catch (error) {
            console.error("Import failed:", error);
            alert("Failed to import template.");
        } finally {
            setImporting(false);
        }
    };



    if (loading && !vaults.length && !notes.length) {
        return (
            <div className="p-10 flex justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full"></div>
            </div>
        )
    }

    // NOTE VIEW
    if (vaultId && activeVault) {

        return (
            <div className="flex flex-col md:flex-row h-[calc(100dvh-64px)] md:h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-900">
                <Helmet>
                    <title>{activeVault.name} | Edusimulate</title>
                </Helmet>
                {activeVault.css && (
                    <style>{activeVault.css}</style>
                )}

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {/* Mobile Top Bar (Persistent) */}
                <div className="md:hidden flex items-center justify-between p-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 z-20 shadow-sm">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="flex items-center gap-2 text-slate-700 dark:text-slate-200 px-3 py-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg active:bg-slate-200"
                        aria-label="Open sidebar"
                    >
                        <Icon name="menu" className="w-5 h-5" />
                        <span className="text-sm font-semibold">Files</span>
                    </button>
                    <div className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[50%] text-sm">
                        {selectedNote ? selectedNote.title : activeVault.name}
                    </div>
                </div>

                {/* Left Sidebar: File Explorer */}
                <div className={`fixed inset-y-0 left-0 w-72 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-700 dark:text-slate-300 truncate" title={activeVault.name}>{activeVault.name}</h2>
                        <button onClick={() => setSearchParams({})} className="text-slate-400 hover:text-slate-600" aria-label="Close vault">
                            <Icon name="x" className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <FileExplorer
                            notes={notes}
                            onSelect={(note) => {
                                setIsSidebarOpen(false);
                                setSelectedNote(note);
                            }}
                            selectedNoteId={selectedNote?.id}
                        />
                    </div>

                    <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                        <button onClick={async () => {
                            if (!currentUserId) return;
                            const t = prompt("Note Title");
                            if (t) {
                                await createNoteInVault(currentUserId, vaultId, t, "# New Note");
                                // reload notes roughly
                                const vaultNotes = await getNotesForVault(currentUserId, vaultId);
                                setNotes(vaultNotes);
                            }
                        }} className="w-full flex items-center justify-center gap-2 py-3 bg-brand-primary/10 text-brand-primary rounded-lg hover:bg-brand-primary hover:text-white transition-colors" aria-label="Create new note">
                            <Icon name="plus-square" className="w-5 h-4" />
                            <span className="text-sm font-medium">New Note</span>
                        </button>
                    </div>
                </div>

                {/* Main Content: Editor/Viewer */}
                <div ref={viewerRef} className="flex-1 overflow-auto bg-white dark:bg-slate-800 relative w-full h-full">
                    {selectedNote ? (
                        <div className="max-w-5xl mx-auto p-4 md:p-8 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-700 gap-2">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="min-w-0">
                                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 truncate">{selectedNote.title}</h1>
                                        <div className="text-xs md:text-sm text-slate-400 flex gap-2 truncate">
                                            <span>{selectedNote.path ? `In ${selectedNote.path}` : 'Root'}</span>
                                            <span className="hidden sm:inline">•</span>
                                            <span className="hidden sm:inline">{selectedNote.createdAt?.toDate ? selectedNote.createdAt.toDate().toLocaleDateString() : ''}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 md:gap-2 flex-shrink-0">
                                    <button
                                        onClick={async () => {
                                            if (!currentUserId) return;
                                            try {
                                                const newStatus = !selectedNote.isPublic;
                                                await updateNote(currentUserId, selectedNote.id, { isPublic: newStatus });
                                                // Optimistic update
                                                const updated = { ...selectedNote, isPublic: newStatus };
                                                setSelectedNote(updated);
                                                setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));

                                                if (newStatus) {
                                                    const url = `${window.location.origin}/note/${selectedNote.id}`;
                                                    navigator.clipboard.writeText(url);
                                                    alert("Link copied!");
                                                }
                                            } catch (err) { alert("Failed"); }
                                        }}
                                        className={`p-2 rounded-lg transition-colors ${selectedNote.isPublic ? 'text-brand-primary bg-brand-primary/10' : 'text-slate-400 hover:bg-slate-100'}`}
                                        title="Share"
                                        aria-label="Share note"
                                    >
                                        <Icon name="share" className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!currentUserId || !confirm("Delete?")) return;
                                            await deleteNote(currentUserId, selectedNote.id);
                                            setNotes(prev => prev.filter(n => n.id !== selectedNote.id));
                                            setSelectedNote(null);
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                        title="Delete"
                                        aria-label="Delete note"
                                    >
                                        <Icon name="trash" className="w-5 h-5" />
                                    </button>
                                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                                    <button
                                        onClick={() => {
                                            if (!document.fullscreenElement) {
                                                viewerRef.current?.requestFullscreen().catch((e) => console.log(e));
                                            } else {
                                                document.exitFullscreen();
                                            }
                                        }}
                                        className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg"
                                        title="Toggle Fullscreen"
                                        aria-label="Toggle fullscreen"
                                    >
                                        <Icon name="maximize" className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="prose dark:prose-invert max-w-none flex-1 h-full overflow-hidden">
                                {selectedNote.title.endsWith('.canvas') ? (
                                    <CanvasRenderer
                                        content={selectedNote.content}
                                        onNavigate={handleNavigate}
                                        onSave={handleSaveCanvas}
                                        files={notes}
                                    />
                                ) : (
                                    <div className="h-full overflow-y-auto p-4 pb-20">
                                        <MarkdownPreview content={selectedNote.content} onNavigate={handleNavigate} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                            <Icon name="file-text" className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg">Select a file to view</p>
                            <p className="text-sm opacity-60 mt-2">Use the "Files" button above to browse.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // VAULTS VIEW
    return (
        <div className="p-6">
            <Helmet>
                <title>My Vaults | Edusimulate</title>
            </Helmet>

            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Vaults</h1>
                    <p className="text-slate-500 dark:text-slate-400">Organize your knowledge base.</p>
                </div>
                <button
                    onClick={handleCreateVault}
                    className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-white hover:bg-brand-primary-dark transition-colors"
                >
                    <Icon name="plus-square" className="h-5 w-5" />
                    <span>New Vault</span>
                </button>
            </div>

            {vaults.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
                    <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-2">Start Engineering Maths</h3>
                            <p className="text-blue-50 mb-6">
                                Jumpstart your engineering notes with a default Sequence & Series canvas using Canvas Candy.
                            </p>
                            <button
                                onClick={importTemplate}
                                disabled={importing}
                                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors disabled:opacity-75 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {importing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                                        Installing...
                                    </>
                                ) : (
                                    <>
                                        <Icon name="download" className="w-5 h-5" />
                                        Install Template
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="absolute -right-12 -bottom-12 opacity-20">
                            <Icon name="layers" className="w-64 h-64" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group flex flex-col justify-center items-center text-center cursor-pointer" onClick={handleCreateVault}>
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Icon name="plus-square" className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Create Fresh Vault</h3>
                        <p className="text-slate-500 dark:text-slate-400">
                            Start from scratch with an empty vault and build your own system.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {vaults.map(vault => (
                        <div
                            key={vault.id}
                            onClick={() => setSearchParams({ vaultId: vault.id })}
                            className="group relative bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-lg group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                    <Icon name="layers" className="w-6 h-6" />
                                </div>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm(`Are you sure you want to delete vault "${vault.name}"? This will delete ALL notes inside it.`)) {
                                            try {
                                                if (currentUserId) {
                                                    await deleteVault(currentUserId, vault.id);
                                                    setVaults(prev => prev.filter(v => v.id !== vault.id));
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                alert("Failed to delete vault");
                                            }
                                        }
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Vault"
                                >
                                    <Icon name="trash" className="w-5 h-5" />
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-brand-primary transition-colors">{vault.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                                {vault.description || "No description"}
                            </p>
                            <div className="flex items-center text-xs text-slate-400">
                                <span>Updated {vault.updatedAt?.toDate ? vault.updatedAt.toDate().toLocaleDateString() : 'Just now'}</span>
                            </div>
                        </div>
                    ))}

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-primary hover:bg-brand-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-slate-500 dark:text-slate-400 hover:text-brand-primary" onClick={handleCreateVault}>
                        <Icon name="plus-square" className="w-8 h-8 mb-2" />
                        <span className="font-medium">New Vault</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyNotesPage;
