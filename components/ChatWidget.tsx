import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Chat, ChatMessage, chatService } from '../services/chatService';
import { uploadToImgBB } from '../services/imgbbService';
import { User } from '../types';
import Icon from './common/Icon';
import { Link, useNavigate } from 'react-router-dom';
import CallModal from './CallModal';
import { webrtcService } from '../services/webrtcService';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User | null;
    chats: Chat[];
    isLoadingChats: boolean;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
    isOpen,
    onClose,
    currentUser,
    chats,
    isLoadingChats,
}) => {
    const navigate = useNavigate();
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [chatImageUrl, setChatImageUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [activeChatUser, setActiveChatUser] = useState<Partial<User> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [creatingChat, setCreatingChat] = useState(false);

    // Call State
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);
    const [currentCallId, setCurrentCallId] = useState<string | null>(null);
    const [isCaller, setIsCaller] = useState(false);

    // Window State
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    // Window Size Hook for Responsive Logic
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const dragStartPos = useRef({ x: 0, y: 0 });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Track window resize
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;

    // DRAG LOGIC (Desktop Only)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isMobile || isMaximized) return; // Disable drag on mobile or when maximized
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            e.preventDefault();
            setPosition({
                x: e.clientX - dragStartPos.current.x,
                y: e.clientY - dragStartPos.current.y
            });
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    // Data Subscriptions and Logic
    useEffect(() => {
        if (!selectedChatId) {
            setMessages([]);
            return;
        }
        const unsubscribe = chatService.subscribeToMessages(selectedChatId, (msgs) => {
            setMessages(msgs);
            if (currentUser?.uid) {
                chatService.markChatRead(selectedChatId, currentUser.uid);
            }
        });
        return () => unsubscribe();
    }, [selectedChatId, currentUser]);

    useEffect(() => {
        if (!isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isMinimized]);

    useEffect(() => {
        const search = async () => {
            if (searchTerm.trim().length > 1) {
                const results = await chatService.searchUsers(searchTerm);
                setSearchResults(results.filter(u => u.uid !== currentUser?.uid));
            } else {
                setSearchResults([]);
            }
        };
        const timeout = setTimeout(search, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm, currentUser]);

    const handleChatSelect = async (chat: Chat) => {
        if (selectedChatId === chat.id) return;

        // Mark as read
        if (currentUser && chat.unreadCounts?.[currentUser.uid] > 0) {
            chatService.markChatRead(chat.id, currentUser.uid);
        }

        setSearchTerm('');
        setSearchResults([]);
        const otherId = chat.participants.find(p => p !== currentUser.uid);
        if (otherId) {
            const details = await chatService.fetchUserDetails(otherId);
            setActiveChatUser(details);
        }
        setSelectedChatId(chat.id);
    };

    const handleUserSelect = async (otherUser: User) => {
        if (!currentUser) return;
        setCreatingChat(true);
        try {
            const chatId = await chatService.getOrCreateChat(currentUser.uid, otherUser.uid);
            setSearchTerm('');
            setSearchResults([]);
            setActiveChatUser(otherUser);
            setSelectedChatId(chatId);
        } catch (e) {
            console.error(e);
        } finally {
            setCreatingChat(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const url = await uploadToImgBB(file);
            setChatImageUrl(url);
        } catch (error) {
            console.error("Chat upload failed", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSend = async () => {
        if ((!input.trim() && !chatImageUrl) || !selectedChatId || !currentUser) return;

        const optimisicId = 'opt_' + Date.now();
        const optimisticMessage: ChatMessage = {
            id: optimisicId,
            senderId: currentUser.uid,
            text: input,
            imageUrl: chatImageUrl,
            timestamp: {
                seconds: Date.now() / 1000,
                nanoseconds: 0,
                toDate: () => new Date(),
                toMillis: () => Date.now(),
                isEqual: () => false,
                valueOf: () => Date.now().toString(),
                toJSON: () => ({ seconds: Date.now() / 1000, nanoseconds: 0 })
            } as any,
            isRead: false
        };

        setMessages(prev => [...prev, optimisticMessage]);
        const prevInput = input;
        const prevImage = chatImageUrl;

        setInput('');
        setChatImageUrl('');

        try {
            await chatService.sendMessage(selectedChatId, currentUser.uid, prevInput, prevImage || undefined);
        } catch (e) {
            console.error("Failed to send", e);
            setMessages(prev => prev.filter(m => m.id !== optimisicId));
            setInput(prevInput);
            setChatImageUrl(prevImage);
        }
    };

    const startVideoCall = async () => {
        if (!selectedChatId || !currentUser || !activeChatUser?.uid) return;
        try {
            const callId = await webrtcService.createRoom(currentUser.uid, activeChatUser.uid, 'video');
            await chatService.sendMessage(selectedChatId, currentUser.uid, "Started a video call", undefined, callId, 'video');
            setCurrentCallId(callId);
            setIsCaller(true);
            setIsCallModalOpen(true);
        } catch (e: any) {
            console.error("Failed to start call", e);
            // Show user-friendly error message
            const errorMsg = e.message || 'Failed to start video call. Please check your camera and microphone permissions.';
            alert(errorMsg);
        }
    };

    const joinVideoCall = (callId: string) => {
        setCurrentCallId(callId);
        setIsCaller(false);
        setIsCallModalOpen(true);
    };



    if (!isOpen || !currentUser) return null;

    // --- RENDER LOGIC ---

    // Determine styles based on state
    // Mobile: Always fixed inset-0 (Full Screen)
    // Desktop: Fixed, transform applied for drag

    const desktopStyle = {
        transform: isMaximized ? 'none' : `translate(${position.x}px, ${position.y}px)`,
        width: isMaximized ? '100%' : '400px',
        height: isMaximized ? '100%' : (isMinimized ? 'auto' : '600px'),
        bottom: isMaximized ? 0 : '80px',
        right: isMaximized ? 0 : '24px',
        borderRadius: isMaximized ? 0 : '1rem',
    };

    const content = (
        <>
            <div
                className={`fixed z-[9999] bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800
                    ${isMobile
                        ? 'inset-0 w-full h-full rounded-none' // Mobile: Full Screen
                        : 'rounded-2xl transition-all duration-200' // Desktop
                    }
                `}
                style={isMobile ? {} : desktopStyle}
            >
                {/* Header */}
                <div
                    onMouseDown={handleMouseDown}
                    className={`flex-shrink-0 p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between 
                        bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10 select-none
                        ${isMobile ? '' : 'cursor-move'}
                    `}
                >
                    <div className="flex items-center gap-3">
                        {/* Window Controls (Desktop Only) */}
                        {!isMobile && (
                            <div className="flex items-center gap-1.5 mr-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMinimized(!isMinimized);
                                    }}
                                    className="w-3.5 h-3.5 rounded-full bg-yellow-500 hover:scale-110 transition-transform shadow-sm flex items-center justify-center group"
                                    title={isMinimized ? "Expand" : "Minimize"}
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClose();
                                        navigate('/chat');
                                    }}
                                    className="w-3.5 h-3.5 rounded-full bg-green-500 hover:scale-110 transition-transform shadow-sm"
                                    title="Full Screen Page"
                                />
                                <button
                                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                                    className="w-3.5 h-3.5 rounded-full bg-red-500 hover:scale-110 transition-transform shadow-sm"
                                    title="Close"
                                />
                            </div>
                        )}

                        {selectedChatId && (!isMinimized || isMobile) ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedChatId(null); }}
                                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors z-20"
                                >
                                    <Icon name="arrowLeft" className="w-5 h-5 text-slate-900 dark:text-white" />
                                </button>
                                <div className="flex items-center gap-2">
                                    <img src={activeChatUser?.avatar || 'https://i.pravatar.cc/150'} loading="lazy" decoding="async" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" />
                                    <div className="flex flex-col">
                                        <h3 className="font-bold text-sm leading-none text-slate-900 dark:text-gray-100">{activeChatUser?.name}</h3>
                                        <span className="text-[10px] text-green-500">@{activeChatUser?.username}</span>
                                    </div>
                                </div>
                                <button onClick={startVideoCall} className="p-2 ml-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400" title="Start Video Call">
                                    <Icon name="video" className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <h3 className="font-bold text-lg ml-1 text-slate-800 dark:text-white">Messages</h3>
                        )}
                    </div>

                    {isMobile && (
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Icon name="x" className="w-6 h-6 text-slate-500" />
                        </button>
                    )}
                </div>

                {/* Content (Hidden if minimized on Desktop) */}
                <div className={`flex-1 overflow-hidden relative flex flex-col bg-white dark:bg-slate-900 ${(!isMobile && isMinimized) ? 'hidden' : ''}`}>
                    {/* List View */}
                    {!selectedChatId && (
                        <div className="absolute inset-0 overflow-y-auto p-2 scrollbar-thin">
                            <div className="p-2 sticky top-0 bg-white dark:bg-slate-900 z-10 pb-4">
                                <div className="relative">
                                    <Icon name="search" className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-brand-primary/50 text-slate-900 dark:text-white"
                                    />
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="absolute top-12 left-0 right-0 bg-white dark:bg-slate-900 shadow-xl rounded-xl border border-slate-200 dark:border-slate-800 z-20 max-h-60 overflow-y-auto">
                                        {searchResults.map(u => (
                                            <div key={u.uid} onClick={() => !creatingChat && handleUserSelect(u)} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-3">
                                                <img src={u.avatar || 'https://i.pravatar.cc/150'} loading="lazy" decoding="async" className="w-8 h-8 rounded-full" />
                                                <p className="text-sm font-bold flex-1 text-slate-900 dark:text-white">{u.name}</p>
                                                {creatingChat && <Icon name="spinner" className="w-4 h-4 animate-spin" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                {isLoadingChats ? (
                                    <div className="text-center p-4 text-slate-400 text-xs">Loading...</div>
                                ) : chats.length === 0 ? (
                                    <div className="text-center p-8 text-slate-400">
                                        <p className="text-sm">No chats yet.</p>
                                    </div>
                                ) : (
                                    chats.map(chat => (
                                        <ChatListItem
                                            key={chat.id}
                                            chat={chat}
                                            currentUser={currentUser}
                                            selectedChatId={selectedChatId}
                                            onSelect={handleChatSelect}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Chat View */}
                    {selectedChatId && (
                        <div className="absolute inset-0 flex flex-col bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin flex flex-col">
                                <div className="flex-1" />
                                <AnimatePresence initial={false}>
                                    {messages.map(msg => {
                                        const isMe = msg.senderId === currentUser.uid;
                                        return (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.2 }}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-brand-primary text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none shadow-sm'}`}>
                                                    {msg.imageUrl && (
                                                        <img src={msg.imageUrl} loading="lazy" decoding="async" alt="Attachment" className="mb-2 rounded-lg max-h-48 object-cover" />
                                                    )}
                                                    {msg.text && <p>{msg.text}</p>}
                                                    {msg.callId && (
                                                        <button
                                                            onClick={() => msg.callId && joinVideoCall(msg.callId)}
                                                            className={`mt-2 flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-colors ${isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-brand-primary text-white hover:bg-brand-secondary'}`}
                                                        >
                                                            <Icon name="video" className="w-4 h-4" />
                                                            {isMe ? 'Join Call Again' : 'Join Video Call'}
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                                        <Icon name="image" className={`w-5 h-5 ${isUploading ? 'animate-pulse opacity-50' : ''}`} />
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                                    </label>
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                            placeholder="Type a message..."
                                            className="w-full px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-brand-primary/50 text-sm text-slate-900 dark:text-white"
                                        />
                                        {chatImageUrl && (
                                            <div className="absolute bottom-full left-0 mb-2 p-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                                                <div className="relative">
                                                    <img src={chatImageUrl} className="h-16 w-16 object-cover rounded-md" />
                                                    <button
                                                        onClick={() => setChatImageUrl('')}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleSend}
                                        disabled={(!input.trim() && !chatImageUrl) || isUploading}
                                        className="p-2 rounded-full bg-brand-primary text-white disabled:opacity-50"
                                    >
                                        <Icon name="send" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <CallModal
                isOpen={isCallModalOpen}
                onClose={() => setIsCallModalOpen(false)}
                callId={currentCallId}
                isCaller={isCaller}
                otherUser={activeChatUser}
            />
        </>
    );

    return ReactDOM.createPortal(content, document.body);
};

const ChatListItem: React.FC<{
    chat: Chat;
    currentUser: User;
    selectedChatId: string | null;
    onSelect: (chat: Chat) => void;
}> = React.memo(({ chat, currentUser, selectedChatId, onSelect }) => {
    const [otherUser, setOtherUser] = useState<Partial<User> | null>(null);
    useEffect(() => {
        const otherId = chat.participants.find(p => p !== currentUser.uid);
        if (otherId) chatService.fetchUserDetails(otherId).then(setOtherUser);
    }, [chat, currentUser.uid]);

    if (!otherUser) return <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-2"></div>;

    const unreadCount = chat.unreadCounts?.[currentUser.uid] || 0;

    return (
        <div
            onClick={() => onSelect(chat)}
            className={`p-3 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 ${selectedChatId === chat.id ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
        >
            <img src={otherUser.avatar || 'https://i.pravatar.cc/150'} loading="lazy" decoding="async" className="w-10 h-10 rounded-full" />
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                    <h4 className={`font-bold text-sm truncate ${unreadCount > 0 ? 'text-black dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{otherUser.name}</h4>
                    {unreadCount > 0 && (
                        <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-brand-primary text-white text-[10px] font-bold rounded-full shadow-sm">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>
                <p className={`text-xs truncate ${unreadCount > 0 ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                    {chat.lastMessage?.text || (chat.lastMessage?.imageUrl ? '📷 Photo' : 'Start chatting...')}
                </p>
            </div>
        </div>
    );
});

export default ChatWidget;
