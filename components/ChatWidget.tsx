import React, { useState, useEffect, useRef } from 'react';
import { Chat, ChatMessage, chatService } from '../services/chatService';
import { User } from '../types';
import Icon from './common/Icon';
import { Link, useNavigate } from 'react-router-dom';

interface ChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
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
    const [activeChatUser, setActiveChatUser] = useState<Partial<User> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [creatingChat, setCreatingChat] = useState(false);

    // Drag State
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false); // New state for maximize toggle
    const dragStartPos = useRef({ x: 0, y: 0 });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // DRAG LOGIC
    const handleMouseDown = (e: React.MouseEvent) => {
        // Removed window width check to allow dragging on mobile
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            e.preventDefault(); // Prevent text selection
            setPosition({
                x: e.clientX - dragStartPos.current.x,
                y: e.clientY - dragStartPos.current.y
            });
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            // Add touch support for mobile drag
            window.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                const touch = e.touches[0];
                setPosition({
                    x: touch.clientX - dragStartPos.current.x,
                    y: touch.clientY - dragStartPos.current.y
                });
            });
            window.addEventListener('touchend', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    // Subscribe to messages
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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Search logic
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

    const handleSend = async () => {
        if (!input.trim() || !selectedChatId || !currentUser) return;
        try {
            await chatService.sendMessage(selectedChatId, currentUser.uid, input);
            setInput('');
        } catch (e) {
            console.error("Failed to send", e);
        }
    };

    const ChatListItem: React.FC<{ chat: Chat }> = ({ chat }) => {
        const [otherUser, setOtherUser] = useState<Partial<User> | null>(null);
        useEffect(() => {
            const otherId = chat.participants.find(p => p !== currentUser.uid);
            if (otherId) chatService.fetchUserDetails(otherId).then(setOtherUser);
        }, [chat]);

        if (!otherUser) return <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-2"></div>;

        const lastRead = chat.lastRead?.[currentUser.uid];
        const isUnreadMsg = lastRead && chat.lastMessage?.timestamp &&
            chat.lastMessage.timestamp.seconds > lastRead.seconds &&
            chat.lastMessage.senderId !== currentUser.uid;

        return (
            <div
                onClick={() => handleChatSelect(chat)}
                className={`p-3 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 ${selectedChatId === chat.id ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
            >
                <img src={otherUser.avatar || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-full" />
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <h4 className={`font-bold text-sm truncate ${isUnreadMsg ? 'text-black dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{otherUser.name}</h4>
                        {isUnreadMsg && <div className="w-2 h-2 rounded-full bg-brand-primary"></div>}
                    </div>
                    <p className={`text-xs truncate ${isUnreadMsg ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                        {chat.lastMessage?.text || 'Start chatting...'}
                    </p>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed z-50 flex flex-col shadow-2xl overflow-hidden animate-fade-in-up transition-all duration-200 
                   ${isMaximized ? 'inset-0 w-full h-full rounded-none' : 'w-[90vw] h-[70vh] bottom-20 right-4 rounded-2xl md:w-[400px] md:h-[600px] md:bottom-20 md:right-6'}
                   border border-slate-200 dark:border-slate-800`}
            style={{
                transform: isMaximized ? 'none' : `translate(${position.x}px, ${position.y}px)`
            }}
        >
            {/* Header */}
            <div
                onMouseDown={handleMouseDown}
                onTouchStart={(e) => {
                    // Simple touch drag start
                    const touch = e.touches[0];
                    setIsDragging(true);
                    dragStartPos.current = {
                        x: touch.clientX - position.x,
                        y: touch.clientY - position.y
                    };
                }}
                className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between 
                       bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10 select-none 
                       cursor-move"
            >
                <div className="flex items-center gap-3">
                    {/* Window Controls (Visible on all screens now) */}
                    <div className="flex items-center gap-1.5 mr-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            className="w-3.5 h-3.5 rounded-full bg-red-500 hover:scale-110 transition-transform shadow-sm flex items-center justify-center group"
                            title="Close"
                        >
                            {/* Optional: Add X icon on hover */}
                            <Icon name="x" className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMaximized(!isMaximized);
                            }}
                            className="w-3.5 h-3.5 rounded-full bg-green-500 hover:scale-110 transition-transform shadow-sm flex items-center justify-center group"
                            title={isMaximized ? "Restore" : "Maximize"}
                        >
                            <Icon name={isMaximized ? "minimize" : "maximize"} className="w-2 h-2 text-green-900 opacity-0 group-hover:opacity-100" />
                        </button>
                    </div>

                    {selectedChatId ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedChatId(null); }}
                                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors z-20 flex-shrink-0"
                            >
                                <Icon name="arrow-left" className="w-4 h-4 text-slate-900 dark:text-white" />
                            </button>
                            <div className="flex items-center gap-2 overflow-hidden">
                                <img src={activeChatUser?.avatar || 'https://i.pravatar.cc/150'} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" />
                                <div className="flex flex-col min-w-0">
                                    <h3 className="font-bold text-sm leading-none text-slate-900 dark:text-gray-100 truncate">{activeChatUser?.name}</h3>
                                    <span className="text-[10px] text-green-500 truncate">@{activeChatUser?.username}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <h3 className="font-bold text-lg ml-1 text-slate-800 dark:text-white">Messages</h3>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 bg-white dark:bg-slate-900 w-full h-full overflow-hidden flex flex-col relative">

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
                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-12 left-0 right-0 bg-white dark:bg-slate-900 shadow-xl rounded-xl border border-slate-200 dark:border-slate-800 z-20 max-h-60 overflow-y-auto">
                                    {searchResults.map(u => (
                                        <div key={u.uid} onClick={() => !creatingChat && handleUserSelect(u)} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-3">
                                            <img src={u.avatar || 'https://i.pravatar.cc/150'} className="w-8 h-8 rounded-full" />
                                            <p className="text-sm font-bold flex-1 text-slate-900 dark:text-white">{u.name}</p>
                                            {creatingChat && <Icon name="loader" className="w-4 h-4 animate-spin" />}
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
                                chats.map(chat => <ChatListItem key={chat.id} chat={chat} />)
                            )}
                        </div>
                    </div>
                )}

                {/* Chat View */}
                {selectedChatId && (
                    <div className="absolute inset-0 flex flex-col bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin flex flex-col">
                            <div className="flex-1" />
                            {messages.map(msg => {
                                const isMe = msg.senderId === currentUser.uid;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-brand-primary text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none shadow-sm'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-brand-primary/50 text-sm text-slate-900 dark:text-white"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
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
    );
};

export default ChatWidget;
