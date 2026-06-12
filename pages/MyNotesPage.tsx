import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, Home, Share2, Trash2, Plus, LayoutGrid, Maximize, FileEdit, Settings, Search, Upload } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { createBoard, getUserBoards, updateBoard, deleteBoard, searchPublicBoards, getPublicBoard } from '../services/firestoreService';
import { CanvasBoard } from '../types';
import Icon from '../components/common/Icon';
import CanvasRenderer from '../components/CanvasRenderer';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';

const MyNotesPage: React.FC = () => {
    const [boards, setBoards] = useState<CanvasBoard[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const boardId = searchParams.get('boardId');
    const navigate = useNavigate();
    const location = useLocation();

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<'my_boards' | 'community'>('my_boards');
    const [searchQuery, setSearchQuery] = useState('');
    const [communityBoards, setCommunityBoards] = useState<CanvasBoard[]>([]);
    const [communityLoading, setCommunityLoading] = useState(false);
    const [activeCommunityBoard, setActiveCommunityBoard] = useState<CanvasBoard | null>(null);

    const isPublic = searchParams.get('isPublic') === 'true';

    const handleBack = useCallback(() => {
        if (location.key !== 'default') {
            navigate(-1);
        } else {
            navigate('/dashboard');
        }
    }, [navigate, location]);

    useEffect(() => {
        let unsubscribeAuth: (() => void) | null = null;
        let cancelled = false;

        import('../services/firebase').then(({ auth }) => {
            if (cancelled) return;
            unsubscribeAuth = auth.onAuthStateChanged(user => {
                if (user) {
                    setCurrentUserId(user.uid);
                } else {
                    setLoading(false);
                }
            });
        });

        return () => {
            cancelled = true;
            unsubscribeAuth?.();
        };
    }, []);

    useEffect(() => {
        if (!currentUserId) return;

        const loadBoards = async () => {
            setLoading(true);
            try {
                const userBoards = await getUserBoards(currentUserId);
                setBoards(userBoards);
            } catch (err) {
                console.error("Failed to load boards", err);
            } finally {
                setLoading(false);
            }
        };
        loadBoards();
    }, [currentUserId]);

    useEffect(() => {
        if (activeTab === 'community') {
            const loadCommunity = async () => {
                setCommunityLoading(true);
                try {
                    const results = await searchPublicBoards(searchQuery);
                    setCommunityBoards(results);
                } catch (err) {
                    console.error("Failed to load community boards", err);
                } finally {
                    setCommunityLoading(false);
                }
            };
            const debounce = setTimeout(loadCommunity, 300);
            return () => clearTimeout(debounce);
        }
    }, [activeTab, searchQuery]);

    useEffect(() => {
        if (boardId && isPublic && !activeCommunityBoard) {
            getPublicBoard(boardId).then(board => {
                if (board) setActiveCommunityBoard(board);
            }).catch(err => console.error("Failed to fetch public board:", err));
        }
    }, [boardId, isPublic, activeCommunityBoard]);

    const handleCreateBoard = async () => {
        if (!currentUserId) return;
        const name = prompt("Enter Board Name:");
        if (!name) return;

        try {
            const newBoard = await createBoard(currentUserId, name);
            setBoards(prev => [newBoard, ...prev]);
            setSearchParams({ boardId: newBoard.id });
        } catch (err: any) {
            console.error(err);
            alert(`Failed to create board: ${err.message || 'Unknown error'}`);
        }
    };

    const handleImportCanvas = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUserId) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                // Validate it's a valid JSON with nodes and edges
                const parsed = JSON.parse(content);
                if (!parsed.nodes || !parsed.edges) throw new Error("Invalid .canvas file format.");
                
                const name = file.name.replace(/\.canvas$/i, '');
                const newBoard = await createBoard(currentUserId, name, undefined, content);
                setBoards(prev => [newBoard, ...prev]);
                setSearchParams({ boardId: newBoard.id });
            } catch (err: any) {
                console.error("Import failed:", err);
                alert(`Failed to import .canvas file: ${err.message}`);
            }
        };
        reader.readAsText(file);
        // reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const activeBoard = isPublic ? activeCommunityBoard : boards.find(b => b.id === boardId);

    const handleSaveCanvas = async (newContent: string) => {
        if (!currentUserId || !activeBoard) return;

        // Optimistic UI update
        const updated = { ...activeBoard, canvasData: newContent };
        setBoards(prev => prev.map(b => b.id === updated.id ? updated : b));

        try {
            await updateBoard(currentUserId, activeBoard.id, { canvasData: newContent });
        } catch (err) {
            console.error("Failed to save canvas", err);
        }
    };

    if (loading && !boards.length) {
        return (
            <div className="py-32 w-full flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full shadow-lg"></div>
            </div>
        )
    }

    // ==========================================
    // EDITOR VIEW (FULL SCREEN CANVAS)
    // ==========================================
    if (boardId && activeBoard) {
        return (
            <div className="relative w-full h-[calc(100vh-180px)] bg-slate-50 dark:bg-slate-900 overflow-hidden flex flex-col rounded-2xl" ref={viewerRef}>
                <Helmet>
                    <title>{activeBoard.name} | Canvas | Edusimulate</title>
                </Helmet>

                {/* Floating Top Nav (Glassmorphism) */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 md:gap-4 px-4 py-2 md:px-6 md:py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-full shadow-xl shadow-slate-200/20 dark:shadow-black/40">
                    <button onClick={() => setSearchParams({})} className="p-2 text-slate-500 hover:text-brand-primary dark:text-slate-400 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" title="Back to Dashboard">
                        <Home className="w-5 h-5" />
                    </button>
                    
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                    
                    <div className="font-semibold text-slate-800 dark:text-slate-100 px-2 max-w-[150px] md:max-w-[300px] truncate text-sm md:text-base">
                        {activeBoard.name}
                    </div>

                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>

                    <button
                        onClick={async () => {
                            if (!currentUserId) return;
                            try {
                                const newStatus = !activeBoard.isPublic;
                                await updateBoard(currentUserId, activeBoard.id, { isPublic: newStatus });
                                const updated = { ...activeBoard, isPublic: newStatus };
                                setBoards(prev => prev.map(b => b.id === updated.id ? updated : b));
                                if (newStatus) {
                                    const url = `${window.location.origin}/board/${activeBoard.id}`;
                                    navigator.clipboard.writeText(url);
                                    alert("Public link copied to clipboard!");
                                }
                            } catch (err) { alert("Failed to share."); }
                        }}
                        className={`p-2 rounded-full transition-all ${activeBoard.isPublic ? 'text-brand-primary bg-brand-primary/10' : 'text-slate-500 hover:text-brand-primary dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Share Board"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => {
                            if (!document.fullscreenElement) {
                                viewerRef.current?.requestFullscreen().catch(e => console.log(e));
                            } else {
                                document.exitFullscreen();
                            }
                        }}
                        className="p-2 text-slate-500 hover:text-brand-primary dark:text-slate-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block"
                        title="Fullscreen"
                    >
                        <Maximize className="w-5 h-5" />
                    </button>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 w-full h-full relative">
                    <CanvasRenderer
                        content={activeBoard.canvasData}
                        onSave={handleSaveCanvas}
                    />
                </div>
            </div>
        );
    }

    // ==========================================
    // DASHBOARD VIEW (BOARDS LIST)
    // ==========================================
    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-900/50 p-4 md:p-8">
            <Helmet>
                <title>My Canvas Boards | Edusimulate</title>
            </Helmet>

            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBack} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-brand-primary hover:border-brand-primary/50 hover:shadow-lg hover:shadow-brand-primary/10 rounded-full transition-all group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Canvas Boards</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-base">Your infinite workspaces for brainstorming and learning.</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <input 
                            type="file" 
                            accept=".canvas" 
                            ref={fileInputRef} 
                            onChange={handleImportCanvas} 
                            className="hidden" 
                        />
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3.5 text-slate-700 dark:text-slate-200 font-semibold shadow-sm hover:shadow-md transition-all"
                        >
                            <Upload className="w-5 h-5" />
                            <span className="hidden sm:inline">Import</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCreateBoard}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-blue-600 px-6 py-3.5 text-white font-semibold shadow-lg shadow-brand-primary/30 hover:shadow-xl hover:shadow-brand-primary/40 transition-all border border-white/10"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create Board</span>
                        </motion.button>
                    </div>
                </header>

                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                    <div className="flex gap-6">
                        <button 
                            onClick={() => setActiveTab('my_boards')}
                            className={`pb-4 border-b-2 font-semibold transition-colors ${activeTab === 'my_boards' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                        >
                            My Boards
                        </button>
                        <button 
                            onClick={() => setActiveTab('community')}
                            className={`pb-4 border-b-2 font-semibold transition-colors ${activeTab === 'community' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                        >
                            Community Boards
                        </button>
                    </div>

                    {activeTab === 'community' && (
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search community..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-slate-700 dark:text-slate-200 w-full md:w-64"
                            />
                        </div>
                    )}
                </div>

                {activeTab === 'my_boards' ? (
                    boards.length === 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div 
                                onClick={handleCreateBoard}
                                className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-primary hover:bg-brand-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center p-12 text-slate-500 hover:text-brand-primary group min-h-[300px]"
                            >
                                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                                    <Plus className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Create First Board</h3>
                                <p className="text-center opacity-80 max-w-[250px]">Start with a blank infinite canvas to map out your ideas.</p>
                            </div>
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            {boards.map(board => (
                                <motion.div
                                    key={board.id}
                                    whileHover={{ y: -5 }}
                                    onClick={() => setSearchParams({ boardId: board.id })}
                                    className="group relative bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-brand-primary/5 transition-all cursor-pointer overflow-hidden flex flex-col h-[280px]"
                                >
                                    {/* Decorative Top Gradient */}
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-primary to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
                                            <LayoutGrid className="w-6 h-6" />
                                        </div>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (confirm(`Delete board "${board.name}"?`)) {
                                                    try {
                                                        if (currentUserId) {
                                                            await deleteBoard(currentUserId, board.id);
                                                            setBoards(prev => prev.filter(b => b.id !== board.id));
                                                        }
                                                    } catch (err) {
                                                        alert("Failed to delete board");
                                                    }
                                                }
                                            }}
                                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 z-10"
                                            title="Delete Board"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-primary transition-colors line-clamp-1">{board.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-auto">
                                        {board.description || "An infinite workspace"}
                                    </p>
                                    
                                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400 font-medium">
                                        <span>Updated {board.updatedAt?.toDate ? board.updatedAt.toDate().toLocaleDateString() : 'Just now'}</span>
                                        {board.isPublic && (
                                            <span className="flex items-center gap-1 text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-full">
                                                <Share2 className="w-3 h-3" /> Shared
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )
                ) : (
                    communityLoading ? (
                        <div className="py-20 flex items-center justify-center w-full">
                            <div className="animate-spin h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full"></div>
                        </div>
                    ) : communityBoards.length === 0 ? (
                        <div className="py-20 text-center text-slate-500 dark:text-slate-400">
                            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No public boards found matching your search.</p>
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            {communityBoards.map(board => (
                                <motion.div
                                    key={board.id}
                                    whileHover={{ y: -5 }}
                                    onClick={() => setSearchParams({ boardId: board.id, isPublic: 'true' })}
                                    className="group relative bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-brand-primary/5 transition-all cursor-pointer overflow-hidden flex flex-col h-[280px]"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                                            <Search className="w-6 h-6" />
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-500 transition-colors line-clamp-1">{board.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-auto">
                                        {board.description || "Community workspace"}
                                    </p>
                                    
                                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400 font-medium">
                                        <span>Updated {board.updatedAt?.toDate ? board.updatedAt.toDate().toLocaleDateString() : 'Just now'}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )
                )}
            </div>
        </div>
    );
};

export default MyNotesPage;
