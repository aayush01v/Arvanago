
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User } from '../types';
import Icon from './common/Icon';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services/chatService';

interface UserSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            document.body.style.overflow = 'hidden';
            // Reset state
            setQuery('');
            setResults([]);
        } else {
            const timer = setTimeout(() => setIsAnimating(false), 300);
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        const search = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const users = await chatService.searchUsers(query);
                setResults(users);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    if (!isOpen && !isAnimating) return null;

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            onClick={onClose}
            className={`fixed inset-0 z-[2000] flex items-start justify-center pt-24 px-4 transition-all duration-300 ${isOpen ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'}`}
        >
            <div
                onClick={e => e.stopPropagation()}
                className={`bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col max-h-[70vh] ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-4'}`}
            >
                {/* Header with Input */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-white dark:bg-slate-800 shrink-0">
                    <Icon name="search" className="w-5 h-5 text-slate-400" />
                    <input
                        className="flex-1 bg-transparent border-none focus:outline-none text-slate-900 dark:text-white text-lg placeholder-slate-400"
                        placeholder="Search users..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoFocus
                    />
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div></div>
                    ) : results.length === 0 && query.trim() ? (
                        <div className="text-center py-10 text-slate-500">No users found.</div>
                    ) : results.length === 0 && !query.trim() ? (
                        <div className="text-center py-10 text-slate-400">Type to search people...</div>
                    ) : (
                        <div className="space-y-1">
                            {results.map(user => (
                                <div
                                    key={user.uid}
                                    onClick={() => {
                                        navigate(`/u/${user.username}`);
                                        onClose();
                                    }}
                                    className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors"
                                >
                                    <img src={user.avatar} className="w-10 h-10 rounded-full bg-slate-100 object-cover shrink-0" alt={user.name} />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{user.name}</h4>
                                        <p className="text-sm text-slate-500 truncate">@{user.username}</p>
                                    </div>
                                    <Icon name="chevronRight" className="w-4 h-4 text-slate-300 shrink-0" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UserSearchModal;
