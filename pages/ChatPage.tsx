import React, { useState, useEffect } from 'react';

import Icon from '@/components/common/Icon';
import SidebarLayout from '@/components/SidebarLayout';
import { chatService, Chat, ChatMessage } from '../services/chatService';
import { auth } from '../services/firebase';
import { User } from '../types';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';

const ChatPage: React.FC = () => {
    // Context from SidebarLayout (User)
    const { user: currentUser } = useOutletContext<{ user: User }>();
    const location = useLocation();
    const navigate = useNavigate();

    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);
    const [activeChatUser, setActiveChatUser] = useState<Partial<User> | null>(null);
    const [creatingChat, setCreatingChat] = useState(false);

    // Subscribe to My Chats
    useEffect(() => {
        if (!currentUser?.uid) return;
        const unsubscribe = chatService.subscribeToChats(currentUser.uid, (updatedChats) => {
            setChats(updatedChats);
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Subscribe to Messages when Chat Selected
    useEffect(() => {
        if (!selectedChatId) {
            setMessages([]);
            return;
        }
        const unsubscribe = chatService.subscribeToMessages(selectedChatId, (msgs) => {
            setMessages(msgs);
        });
        return () => unsubscribe();
    }, [selectedChatId]);

    // Initial Selection (First Chat or State)
    useEffect(() => {
        // Check for navigation state first
        if (location.state?.chatId) {
            setSelectedChatId(location.state.chatId);
            setShowChatOnMobile(true);
            if (location.state.recipientUser) {
                setActiveChatUser(location.state.recipientUser);
            }
        }
        // Fallback to first chat if no state and desktop
        else if (!selectedChatId && chats.length > 0 && !showChatOnMobile && window.innerWidth >= 768) {
            handleChatSelect(chats[0]);
        }
    }, [chats, selectedChatId, location.state]);

    // Search Users
    useEffect(() => {
        const search = async () => {
            if (searchTerm.trim().length > 1) {
                const results = await chatService.searchUsers(searchTerm);
                // Filter out self
                setSearchResults(results.filter(u => u.uid !== currentUser?.uid));
            } else {
                setSearchResults([]);
            }
        };
        const timeout = setTimeout(search, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm, currentUser]);


    const handleChatSelect = async (chat: Chat) => {
        setSelectedChatId(chat.id);
        setShowChatOnMobile(true);

        // Mark as read
        if (currentUser && chat.unreadCounts?.[currentUser.uid] > 0) {
            chatService.markChatRead(chat.id, currentUser.uid);
        }

        // Find other participant ID
        const otherId = chat.participants.find(p => p !== currentUser.uid);
        if (otherId) {
            const details = await chatService.fetchUserDetails(otherId);
            setActiveChatUser(details);
        }
    };

    const handleUserSelect = async (otherUser: User) => {
        if (!currentUser) return;
        setCreatingChat(true);
        try {
            const chatId = await chatService.getOrCreateChat(currentUser.uid, otherUser.uid);
            setSearchTerm(''); // Clear search
            setSearchResults([]);

            // Mark as read immediately on creation/selection via search
            // (Though new chat unread is 0, logic is safe)
            chatService.markChatRead(chatId, currentUser.uid);

            // Optimistic UI updates could go here, but for now wait for subscription
            setSelectedChatId(chatId);
            setActiveChatUser(otherUser);
            setShowChatOnMobile(true);
        } catch (error) {
            console.error("Failed to create chat:", error);
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

    // Helper to get display info for a chat list item
    const ChatListItem: React.FC<{ chat: Chat }> = ({ chat }) => {
        // We need to fetch/store details for list items too. 
        // For simplicity, we'll fetch on mount or use a cache. 
        // In a real app, use a hook or global store.
        const [otherUser, setOtherUser] = useState<Partial<User> | null>(null);

        useEffect(() => {
            const otherId = chat.participants.find(p => p !== currentUser.uid);
            if (otherId) {
                chatService.fetchUserDetails(otherId).then(setOtherUser);
            }
        }, [chat]);

        if (!otherUser) return <div className="p-4 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl h-20 mb-2"></div>;

        const unreadCount = chat.unreadCounts?.[currentUser.uid] || 0;

        return (
            <div
                onClick={() => handleChatSelect(chat)}
                className={`
                    group p-4 rounded-2xl cursor-pointer transition-all border border-transparent relative
                    ${selectedChatId === chat.id
                        ? 'bg-brand-primary/10 border-brand-primary/20 shadow-md'
                        : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-700/60 border-white/40 dark:border-white/5'
                    }
                `}
            >
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <img src={otherUser.avatar || 'https://i.pravatar.cc/150'} alt={otherUser.name} className="w-12 h-12 rounded-full object-cover shadow-sm bg-slate-200" />
                        {/* Status dot could be here if we had online status */}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h4 className={`font-bold text-sm truncate ${selectedChatId === chat.id ? 'text-brand-primary' : ''}`}>
                                {otherUser.name}
                            </h4>
                            {/* Time formatting */}
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {chat.updatedAt?.seconds ? new Date(chat.updatedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'New'}
                                </span>
                                {unreadCount > 0 && (
                                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-brand-primary text-white text-[10px] font-bold rounded-full shadow-sm animate-scale-in">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                        <p className={`text-xs truncate mt-0.5 pr-6 ${unreadCount > 0 ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                            {chat.lastMessage?.text || 'Start a conversation'}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`flex gap-6 animate-fade-in text-slate-800 dark:text-white relative ${window.innerWidth < 768 ? 'h-[calc(100dvh-5rem)]' : 'h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]'}`}>

            {/* Sidebar */}
            <div className={`
                ${showChatOnMobile ? 'hidden md:flex' : 'flex'} 
                w-full md:w-80 flex-shrink-0 flex-col gap-4 transition-all
            `}>
                {/* Search */}
                <div className="relative z-20">
                    <Icon name="search" className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all shadow-sm"
                    />

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-60 overflow-y-auto">
                            {searchResults.map(u => {
                                const isExistingContact = chats.some(chat => chat.participants.includes(u.uid));
                                return (
                                    <div
                                        key={u.uid}
                                        onClick={() => !creatingChat && handleUserSelect(u)}
                                        className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-3 ${creatingChat ? 'opacity-50 cursor-wait' : ''}`}
                                    >
                                        <img src={u.avatar || 'https://i.pravatar.cc/150'} className="w-8 h-8 rounded-full" />
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold ${isExistingContact ? 'text-green-600 dark:text-green-400' : ''}`}>
                                                {u.name}
                                            </p>
                                            <p className="text-xs text-slate-500">@{u.username || 'user'}</p>
                                        </div>
                                        {creatingChat && <Icon name="spinner" className="w-4 h-4 animate-spin text-brand-primary" />}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    {chats.length === 0 ? (
                        <div className="text-center p-8 text-slate-400">
                            <p>No chats yet.</p>
                            <p className="text-xs mt-2">Search for a user to start chatting!</p>
                        </div>
                    ) : (
                        chats.map(chat => <ChatListItem key={chat.id} chat={chat} />)
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`
                ${showChatOnMobile ? 'flex' : 'hidden md:flex'} 
                flex-1 flex-col rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden relative
            `}>
                {!selectedChatId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center animate-fade-in">
                        <div className="w-32 h-32 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-6 relative">
                            <Icon name="message-circle" className="w-16 h-16 text-slate-300 dark:text-slate-500" />
                            <div className="absolute top-0 right-0 w-8 h-8 bg-brand-primary rounded-full animate-bounce delay-75" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Your Messages</h3>
                        <p className="max-w-xs text-sm">Select a conversation from the left or search for a user to start chatting.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="px-4 md:px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-3 md:gap-4">
                                <button
                                    onClick={() => setShowChatOnMobile(false)}
                                    className="md:hidden p-2 -ml-2 rounded-full hover:bg-white/20 dark:hover:bg-slate-700/50"
                                >
                                    <Icon name="arrowLeft" className="w-5 h-5" />
                                </button>

                                <div
                                    className="flex items-center gap-3 md:gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => activeChatUser?.username && navigate(`/u/${activeChatUser.username}`)}
                                >
                                    <div className="relative">
                                        <img src={activeChatUser?.avatar || 'https://i.pravatar.cc/150'} alt={activeChatUser?.name || 'User'} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover shadow-sm text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base md:text-lg leading-tight">{activeChatUser?.name || 'User'}</h3>
                                        <span className="text-[10px] md:text-xs text-brand-primary font-medium">@{activeChatUser?.username || 'user'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 flex flex-col-reverse">
                            {/* Flex col reverse for auto scroll to bottom behavior usually, but simple mapping works if we scroll to bottom on mount. 
                                For simplicity with Firestore ordering (asc), we map normally but might need auto-scroll ref.
                            */}
                            <div className="flex flex-col justify-end min-h-full space-y-4">
                                {messages.map((msg) => {
                                    const isMe = msg.senderId === currentUser?.uid;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] md:max-w-[70%] relative group`}>
                                                <div
                                                    className={`
                                                            px-4 md:px-5 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-sm leading-relaxed shadow-sm animate-fade-in-up
                                                            ${isMe
                                                            ? 'bg-brand-primary text-white rounded-br-none shadow-brand-primary/20'
                                                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-none shadow-sm'
                                                        }
                                                        `}
                                                >
                                                    {msg.text}
                                                </div>
                                                <span className={`text-[10px] text-slate-400 font-medium absolute -bottom-5 ${isMe ? 'right-0' : 'left-0'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                    {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div id="scroll-anchor"></div>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-3 md:p-4 border-t border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
                            <div className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 md:px-5 py-3 md:py-3.5 rounded-full bg-white dark:bg-slate-800 border-none focus:ring-2 focus:ring-brand-primary/50 outline-none shadow-inner placeholder:text-slate-400 transition-all text-sm md:text-base"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="p-3 md:p-3.5 rounded-full bg-brand-primary text-white hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-primary/25 hover:scale-105 active:scale-95"
                                >
                                    <Icon name="send" className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
