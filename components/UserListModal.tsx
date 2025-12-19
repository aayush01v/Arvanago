import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { User } from '../types';
import Icon from './common/Icon';
import { useNavigate } from 'react-router-dom';

interface UserListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    users: User[];
    loading?: boolean;
}

const UserListModal: React.FC<UserListModalProps> = ({ isOpen, onClose, title, users, loading }) => {
    const navigate = useNavigate();
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsAnimating(false), 300);
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen && !isAnimating) return null;

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            onClick={onClose}
            className={`fixed inset-0 z-[2000] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'}`}
        >
            <div
                onClick={e => e.stopPropagation()}
                className={`bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col max-h-[85dvh] mx-4 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0 z-10">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-2 flex-1 min-h-0">
                    {loading ? (
                        <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div></div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">No users found.</div>
                    ) : (
                        <div className="space-y-1">
                            {users.map(user => (
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

export default UserListModal;
