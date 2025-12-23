import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import Icon from '@/components/common/Icon';
import SidebarLayout from '@/components/SidebarLayout';
import { chatService, Chat, ChatMessage } from '../services/chatService';
import { uploadToImgBB } from '../services/imgbbService';
import { auth } from '../services/firebase';
import { User } from '../types';
import { useOutletContext, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import CallModal from '@/components/CallModal';
import { webrtcService } from '../services/webrtcService';

const ChatPage: React.FC = () => {
    // Context from SidebarLayout (User)
    const { user: currentUser } = useOutletContext<{ user: User }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);
    const [activeChatUser, setActiveChatUser] = useState<Partial<User> | null>(null);
    const [chatImageUrl, setChatImageUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [creatingChat, setCreatingChat] = useState(false);

    const [expandedImage, setExpandedImage] = useState<string | null>(null);
    const [localPreview, setLocalPreview] = useState<string | null>(null);

    // Call State
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);
    const [currentCallId, setCurrentCallId] = useState<string | null>(null);
    const [currentCallType, setCurrentCallType] = useState<'video' | 'audio'>('video');
    const [isCaller, setIsCaller] = useState(false);
    const [showCallTypeSelection, setShowCallTypeSelection] = useState(false);

    // Sync URL with State
    useEffect(() => {
        const chatIdParam = searchParams.get('chatId');
        if (chatIdParam) {
            setSelectedChatId(chatIdParam);
            setShowChatOnMobile(true);
            // We need to set activeChatUser. If we have chats loaded, find it.
            // If not (deep link), we might need to fetch it in the effect below or separate logic.
            const chat = chats.find(c => c.id === chatIdParam);
            if (chat && currentUser) {
                const otherId = chat.participants.find(p => p !== currentUser.uid);
                if (otherId) {
                    chatService.fetchUserDetails(otherId).then(setActiveChatUser);
                }
                // Mark as read
                if (chat.unreadCounts?.[currentUser.uid] > 0) {
                    chatService.markChatRead(chat.id, currentUser.uid);
                }
            }
        } else {
            setShowChatOnMobile(false);
            if (window.innerWidth < 768) {
                setSelectedChatId(null);
            }
        }
    }, [searchParams, chats, currentUser]);

    // Cleanup local preview
    useEffect(() => {
        return () => {
            if (localPreview) URL.revokeObjectURL(localPreview);
        };
    }, [localPreview]);

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

    // Initial Selection fallback (Desktop only)
    useEffect(() => {
        const chatIdParam = searchParams.get('chatId');
        if (!chatIdParam && !selectedChatId && chats.length > 0 && window.innerWidth >= 768) {
            setSearchParams({ chatId: chats[0].id }, { replace: true });
        }
    }, [chats, selectedChatId, searchParams]);

    // Search Users
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
        setSearchParams({ chatId: chat.id });
    };

    const handleUserSelect = async (otherUser: User) => {
        if (!currentUser) return;
        setCreatingChat(true);
        try {
            const chatId = await chatService.getOrCreateChat(currentUser.uid, otherUser.uid);
            setSearchTerm(''); // Clear search
            setSearchResults([]);

            setSearchParams({ chatId });
            setActiveChatUser(otherUser);
        } catch (error) {
            console.error("Failed to create chat:", error);
        } finally {
            setCreatingChat(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const preview = URL.createObjectURL(file);
            setLocalPreview(preview);
            setIsUploading(true);
            const url = await uploadToImgBB(file);
            setChatImageUrl(url);
        } catch (error) {
            console.error("Chat upload failed", error);
        } finally {
            setIsUploading(false);
            setLocalPreview(null); // Cleanup done by effect or manually here, but we switch to real URL
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

        // Optimistic Update
        setMessages(prev => [optimisticMessage, ...prev]);
        const prevInput = input;
        const prevImage = chatImageUrl;

        setInput('');
        setChatImageUrl('');
        setLocalPreview(null);

        try {
            await chatService.sendMessage(selectedChatId, currentUser.uid, prevInput, prevImage || undefined);
        } catch (e) {
            console.error("Failed to send", e);
            setMessages(prev => prev.filter(m => m.id !== optimisicId));
            setInput(prevInput);
            setChatImageUrl(prevImage);
        }
    };

    const initiateCall = () => {
        setShowCallTypeSelection(true);
    };

    const startCall = async (type: 'video' | 'audio') => {
        setShowCallTypeSelection(false);
        if (!selectedChatId || !currentUser || !activeChatUser?.uid) return;

        // Optimistic UI: Open modal immediately
        setCurrentCallId(null); // Will be updated shortly
        setCurrentCallType(type);
        setIsCaller(true);
        setIsCallModalOpen(true);

        try {
            const callId = await webrtcService.createRoom(currentUser.uid, activeChatUser.uid, type);
            // Now we have the ID, update the state
            setCurrentCallId(callId);

            const msgText = type === 'video' ? "Started a video call" : "Started an audio call";
            const messageId = await chatService.sendMessage(selectedChatId, currentUser.uid, msgText, undefined, callId, type);

            // Link call to message so we can update status later
            await webrtcService.updateCall(callId, { chatId: selectedChatId, messageId });
        } catch (e) {
            console.error("Failed to start call", e);
            // Close modal on error if it was opened
            setIsCallModalOpen(false);
        }
    };

    const joinVideoCall = (callId: string, type: 'video' | 'audio' = 'video') => {
        setCurrentCallId(callId);
        setCurrentCallType(type);
        setIsCaller(false);
        setIsCallModalOpen(true);
    };

    return (
        <div className="flex gap-6 animate-fade-in text-slate-800 dark:text-white relative h-[calc(100dvh-4rem)] md:h-[calc(100vh-6rem)]">

            {/* Sidebar List */}
            <div className={`
                ${showChatOnMobile ? 'hidden md:flex' : 'flex'} 
                w-full md:w-80 flex-shrink-0 flex-col gap-4 transition-all
            `}>
                {/* Search Header */}
                <div className="relative z-20 px-2">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Icon name="search" className="w-5 h-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-sm outline-none text-sm placeholder:text-slate-400"
                        />
                    </div>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-2 right-2 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-60 overflow-y-auto no-scrollbar z-50">
                            {searchResults.map(u => {
                                const isExistingContact = chats.some(chat => chat.participants.includes(u.uid));
                                return (
                                    <div
                                        key={u.uid}
                                        onClick={() => !creatingChat && handleUserSelect(u)}
                                        className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0 ${creatingChat ? 'opacity-50 cursor-wait' : ''}`}
                                    >
                                        <img src={u.avatar || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-full object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold truncate ${isExistingContact ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                                                {u.name}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">@{u.username || 'user'}</p>
                                        </div>
                                        {creatingChat && <Icon name="spinner" className="w-4 h-4 animate-spin text-brand-primary" />}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Chat List Content */}
                <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {chats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-60">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                <Icon name="message-square" className="w-8 h-8" />
                            </div>
                            <p className="text-slate-500 font-medium">No active chats</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Search for a user above to start your first conversation.</p>
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

            {/* Main Chat Area */}
            <div className={`
                ${showChatOnMobile ? 'flex fixed inset-0 z-50 bg-white dark:bg-slate-900' : 'hidden md:flex'} 
                md:relative flex-1 flex-col md:rounded-3xl md:bg-white/60 md:dark:bg-slate-800/60 md:backdrop-blur-md md:border border-white/40 dark:border-white/10 md:shadow-xl overflow-hidden
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
                        <div className="px-4 md:px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md sticky top-0 z-30">

                            {/* Left: User Info */}
                            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                <div
                                    className="flex items-center gap-3 md:gap-4 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
                                    onClick={() => activeChatUser?.username && navigate(`/u/${activeChatUser.username}`)}
                                >
                                    <div className="relative flex-shrink-0">
                                        <img src={activeChatUser?.avatar || 'https://i.pravatar.cc/150'} alt={activeChatUser?.name || 'User'} className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover shadow-sm ring-2 ring-white/10" />
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-base md:text-lg leading-tight truncate text-slate-900 dark:text-white">{activeChatUser?.name || 'User'}</h3>
                                        <span className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 font-medium truncate block">@{activeChatUser?.username || 'user'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Call Actions */}
                            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 relative">

                                {/* Call Type Selection Popover */}
                                {showCallTypeSelection && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowCallTypeSelection(false)}></div>
                                        <div className="absolute top-full right-0 mt-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 z-50 p-2 flex flex-col gap-1 min-w-[180px] animate-scale-in origin-top-right">
                                            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Call</div>
                                            <button
                                                onClick={() => startCall('audio')}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl text-sm font-bold transition-all group text-slate-700 dark:text-slate-200"
                                            >
                                                <div className="p-2 rounded-full bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                                    <Icon name="phone" className="w-4 h-4" />
                                                </div>
                                                Audio Call
                                            </button>
                                            <button
                                                onClick={() => startCall('video')}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl text-sm font-bold transition-all group text-slate-700 dark:text-slate-200"
                                            >
                                                <div className="p-2 rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                    <Icon name="video" className="w-4 h-4" />
                                                </div>
                                                Video Call
                                            </button>
                                        </div>
                                    </>
                                )}

                                <button
                                    onClick={initiateCall}
                                    className="p-3 md:p-3.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-brand-primary/10 hover:text-brand-primary dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300 shadow-sm border border-transparent hover:border-brand-primary/20 hover:scale-105 active:scale-95"
                                    title="Start Call"
                                >
                                    <Icon name="video" className="w-5 h-5 md:w-6 md:h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent flex flex-col-reverse bg-slate-50/50 dark:bg-slate-900/20">
                            <div className="flex flex-col justify-end min-h-full space-y-3 md:space-y-4">
                                <AnimatePresence initial={false}>
                                    {messages.map((msg, index) => {
                                        const isMe = msg.senderId === currentUser?.uid;
                                        const isSequence = index > 0 && messages[index - 1].senderId === msg.senderId;

                                        return (
                                            <motion.div
                                                key={msg.id}
                                                layout
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.2 }}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSequence ? 'mt-1' : 'mt-4'}`}
                                            >
                                                {!isMe && !isSequence && (
                                                    <img
                                                        src={activeChatUser?.avatar || 'https://i.pravatar.cc/150'}
                                                        className="w-8 h-8 rounded-full mr-2 self-end mb-1 shadow-sm object-cover"
                                                        alt="Sender"
                                                    />
                                                )}
                                                {!isMe && isSequence && <div className="w-10"></div>}

                                                <div className={`max-w-[85%] md:max-w-[70%] relative group`}>
                                                    <div
                                                        className={`
                                                                px-4 md:px-5 py-2.5 md:py-3.5 text-[15px] leading-relaxed shadow-sm break-words
                                                                ${isMe
                                                                ? 'bg-gradient-to-br from-brand-primary to-blue-600 text-white rounded-[1.2rem] rounded-tr-md'
                                                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-[1.2rem] rounded-tl-md border border-slate-100 dark:border-slate-700/50'
                                                            }
                                                        `}
                                                    >
                                                        {msg.imageUrl && (
                                                            <div className="mb-2 -mx-2 -mt-2 overflow-hidden rounded-lg">
                                                                <img
                                                                    src={msg.imageUrl}
                                                                    alt="Attachment"
                                                                    className="w-full max-h-80 object-cover cursor-pointer hover:scale-105 transition-transform duration-500 shadow-sm"
                                                                    onClick={() => setExpandedImage(msg.imageUrl)}
                                                                />
                                                            </div>
                                                        )}

                                                        {msg.text && <p>{msg.text}</p>}

                                                        {msg.callId && (
                                                            msg.callStatus === 'ended' ? (
                                                                <div className={`mt-2 flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-xs ${isMe ? 'bg-white/20 text-white/90' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                                                    <div className={`p-1.5 rounded-full ${isMe ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-600'}`}>
                                                                        <Icon name="phone" className="w-3.5 h-3.5" />
                                                                    </div>
                                                                    <span>Call Ended • {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => msg.callId && joinVideoCall(msg.callId, msg.callType || 'video')}
                                                                    className={`mt-2 flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm transform hover:scale-105 active:scale-95 ${isMe ? 'bg-white text-brand-primary hover:bg-slate-100' : 'bg-brand-primary text-white hover:bg-brand-secondary'}`}
                                                                >
                                                                    <Icon name={msg.callType === 'audio' ? 'phone' : 'video'} className="w-4 h-4" />
                                                                    {isMe ? 'Join Call Again' : `Join ${msg.callType === 'audio' ? 'Audio' : 'Video'} Call`}
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                    <span className={`text-[10px] text-slate-400 font-medium absolute -bottom-5 ${isMe ? 'right-1' : 'left-1'} opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`}>
                                                        {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                                <div id="scroll-anchor"></div>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-3 md:p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 z-20">
                            <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
                                <label className="cursor-pointer p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 mb-0.5 group">
                                    <Icon name="image" className={`w-6 h-6 group-hover:text-brand-primary transition-colors ${isUploading ? 'animate-pulse opacity-50' : ''}`} />
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                                </label>

                                <div className="flex-1 relative bg-slate-100 dark:bg-slate-800 rounded-[1.5rem] focus-within:ring-2 focus-within:ring-brand-primary/50 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-inner border border-transparent focus-within:border-brand-primary/30">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Type a message..."
                                        className="w-full px-5 py-3.5 bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all text-sm md:text-base pr-12"
                                    />
                                    {(chatImageUrl || (isUploading && localPreview)) && (
                                        <div className="absolute bottom-full left-0 mb-3 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 animate-scale-in">
                                            <div className="relative group">
                                                <img src={chatImageUrl || localPreview || ''} className={`h-24 w-24 object-cover rounded-lg ${isUploading ? 'opacity-50 blur-sm' : ''}`} />

                                                {isUploading && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Icon name="loader" className="w-8 h-8 text-brand-primary animate-spin" />
                                                    </div>
                                                )}

                                                {!isUploading && chatImageUrl && (
                                                    <button
                                                        onClick={() => setChatImageUrl('')}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-600 transition-transform hover:scale-110"
                                                    >
                                                        <Icon name="x" className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleSend}
                                    disabled={(!input.trim() && !chatImageUrl) || isUploading}
                                    className="p-3.5 rounded-full bg-brand-primary text-white hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-primary/25 hover:scale-105 active:scale-95 mb-0.5"
                                >
                                    <Icon name="send" className="w-5 h-5 ml-0.5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <CallModal
                isOpen={isCallModalOpen}
                onClose={() => setIsCallModalOpen(false)}
                callId={currentCallId}
                isCaller={isCaller}
                otherUser={activeChatUser}
                callType={currentCallType}
            />

            {/* Expanded Image Modal / Lightbox */}
            <AnimatePresence>
                {expandedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
                        onClick={() => setExpandedImage(null)}
                    >
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={expandedImage}
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        // Prevent closing if clicking image itself, optional, but standard lightbox usually closes on BG click only?
                        // Actually user said "maximise image in chat", so zoom out on click is intuitive.
                        />
                        <button className="absolute top-4 right-4 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors">
                            <Icon name="x" className="w-6 h-6" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

        </div >
    );
};

const ChatListItem: React.FC<{
    chat: Chat;
    currentUser: User | null;
    selectedChatId: string | null;
    onSelect: (chat: Chat) => void;
}> = React.memo(({ chat, currentUser, selectedChatId, onSelect }) => {
    // We need to fetch/store details for list items too. 
    // For simplicity, we'll fetch on mount or use a cache. 
    // In a real app, use a hook or global store.
    const [otherUser, setOtherUser] = useState<Partial<User> | null>(null);

    useEffect(() => {
        if (!currentUser) return;
        const otherId = chat.participants.find(p => p !== currentUser.uid);
        if (otherId) {
            chatService.fetchUserDetails(otherId).then(setOtherUser);
        }
    }, [chat, currentUser]);

    if (!otherUser) return (
        <div className="p-4 mx-2 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl h-18 mb-2"></div>
    );

    const unreadCount = chat.unreadCounts && currentUser ? (chat.unreadCounts[currentUser.uid] || 0) : 0;
    const isSelected = selectedChatId === chat.id;

    return (
        <div
            onClick={() => onSelect(chat)}
            className={`
                    group p-3 mx-2 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden
                    ${isSelected
                    ? 'bg-brand-primary/10 shadow-sm'
                    : 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                }
                `}
        >
            {isSelected && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-primary rounded-r-full"></div>
            )}

            <div className="flex items-center gap-3 relative z-10">
                <div className="relative flex-shrink-0">
                    <img
                        src={otherUser.avatar || 'https://i.pravatar.cc/150'}
                        alt={otherUser.name}
                        className={`w-12 h-12 rounded-full object-cover transition-transform duration-300 group-hover:scale-105 ${isSelected ? 'ring-2 ring-brand-primary/30' : 'ring-1 ring-slate-200 dark:ring-slate-700'}`}
                    />
                    {/* Status dot could be here if we had online status */}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className={`font-bold text-sm truncate transition-colors ${isSelected ? 'text-brand-primary' : 'text-slate-900 dark:text-slate-100'}`}>
                            {otherUser.name}
                        </h4>
                        <span className={`text-[10px] font-medium ${unreadCount > 0 ? 'text-brand-primary' : 'text-slate-400'}`}>
                            {chat.updatedAt?.seconds ? new Date(chat.updatedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'New'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                        <p className={`text-xs truncate transition-colors w-full ${unreadCount > 0 ? 'font-semibold text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                            {chat.lastMessage?.text || (chat.lastMessage?.imageUrl ? '📷 Photo' : 'Start a conversation')}
                        </p>
                        {unreadCount > 0 && (
                            <span className="flex-shrink-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-brand-primary text-white text-[10px] font-bold rounded-full shadow-sm animate-scale-in">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ChatPage;
