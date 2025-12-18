import React, { useState } from 'react';
import { GlassPanel } from '@/components/common/GlassPanel';
import Icon from '@/components/common/Icon';
import SidebarLayout from '@/components/SidebarLayout';

// Mock Data
const CONTACTS = [
    { id: 1, name: 'James Johnson', role: 'Marketing Manager', avatar: 'https://i.pravatar.cc/150?u=james', status: 'online', lastMsg: 'Sure, let\'s catch up later.', time: '2m', unread: 2 },
    { id: 2, name: 'Maria Hernandez', role: 'Student', avatar: 'https://i.pravatar.cc/150?u=maria', status: 'offline', lastMsg: 'Thanks for the help!', time: '1d', unread: 0 },
    { id: 3, name: 'David Smith', role: 'Mentor', avatar: 'https://i.pravatar.cc/150?u=david', status: 'away', lastMsg: 'I checked your assignment.', time: '3d', unread: 0 },
    { id: 4, name: 'Sarah Wilson', role: 'Designer', avatar: 'https://i.pravatar.cc/150?u=sarah', status: 'online', lastMsg: 'The new assets are ready.', time: '1h', unread: 1 },
];

const MOCK_MESSAGES = [
    { id: 1, senderId: 1, text: 'Hi there! How is the course going?', time: '10:30 AM' },
    { id: 2, senderId: 0, text: 'Hey James! It\'s going great, really learning a lot.', time: '10:32 AM' },
    { id: 3, senderId: 1, text: 'That\'s awesome to hear. Let me know if you need any resources.', time: '10:33 AM' },
    { id: 4, senderId: 1, text: 'I shared a PDF in the group.', time: '10:33 AM' },
];

const ChatPage: React.FC = () => {
    const [selectedContact, setSelectedContact] = useState(CONTACTS[0]);
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [input, setInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showChatOnMobile, setShowChatOnMobile] = useState(false); // Mobile state

    const handleSend = () => {
        if (!input.trim()) return;
        const newMsg = {
            id: messages.length + 1,
            senderId: 0, // Me
            text: input,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([...messages, newMsg]);
        setInput('');
    };

    const handleContactSelect = (contact: any) => {
        setSelectedContact(contact);
        setShowChatOnMobile(true);
    };

    const filteredContacts = CONTACTS.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex gap-6 animate-fade-in text-slate-800 dark:text-white">
            {/* Sidebar: Contacts - Hidden on mobile if chat is open */}
            <div className={`
                ${showChatOnMobile ? 'hidden md:flex' : 'flex'} 
                w-full md:w-80 flex-shrink-0 flex-col gap-4 transition-all
            `}>
                {/* Search */}
                <div className="relative">
                    <Icon name="search" className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all shadow-sm"
                    />
                </div>

                {/* Contact List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    {filteredContacts.map(contact => (
                        <div
                            key={contact.id}
                            onClick={() => handleContactSelect(contact)}
                            className={`
                                group p-4 rounded-2xl cursor-pointer transition-all border border-transparent
                                ${selectedContact.id === contact.id
                                    ? 'bg-brand-primary/10 border-brand-primary/20 shadow-md'
                                    : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-700/60 border-white/40 dark:border-white/5'
                                }
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover shadow-sm bg-slate-200" />
                                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${contact.status === 'online' ? 'bg-emerald-500' :
                                        contact.status === 'away' ? 'bg-amber-500' : 'bg-slate-400'
                                        }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`font-bold text-sm truncate ${selectedContact.id === contact.id ? 'text-brand-primary' : ''}`}>
                                            {contact.name}
                                        </h4>
                                        <span className="text-[10px] text-slate-400 font-medium">{contact.time}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{contact.lastMsg}</p>
                                </div>
                                {contact.unread > 0 && (
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] font-bold shadow-lg shadow-brand-primary/30">
                                        {contact.unread}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area - Hidden on mobile if no chat selected (default list view) */}
            <div className={`
                ${showChatOnMobile ? 'flex' : 'hidden md:flex'} 
                flex-1 flex-col rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden relative
            `}>
                {/* Chat Header */}
                <div className="px-4 md:px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Back Button for Mobile */}
                        <button
                            onClick={() => setShowChatOnMobile(false)}
                            className="md:hidden p-2 -ml-2 rounded-full hover:bg-white/20 dark:hover:bg-slate-700/50"
                        >
                            <Icon name="arrow-left" className="w-5 h-5" />
                        </button>

                        <div className="relative">
                            <img src={selectedContact.avatar} alt={selectedContact.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover shadow-sm" />
                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${selectedContact.status === 'online' ? 'bg-emerald-500' :
                                selectedContact.status === 'away' ? 'bg-amber-500' : 'bg-slate-400'
                                }`} />
                        </div>
                        <div>
                            <h3 className="font-bold text-base md:text-lg leading-tight">{selectedContact.name}</h3>
                            <span className="text-[10px] md:text-xs text-brand-primary font-medium">{selectedContact.role}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 md:gap-2">
                        <button className="p-2 md:p-2.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 transition-colors">
                            <Icon name="search" className="w-5 h-5" />
                        </button>
                        <button className="p-2 md:p-2.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 transition-colors">
                            <Icon name="more-horizontal" className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    {messages.map((msg) => {
                        const isMe = msg.senderId === 0;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] md:max-w-[70%] relative group`}>
                                    <div
                                        className={`
                                            px-4 md:px-5 py-3 md:py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
                                            ${isMe
                                                ? 'bg-brand-primary text-white rounded-br-none shadow-brand-primary/20'
                                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-none shadow-sm'
                                            }
                                        `}
                                    >
                                        {msg.text}
                                    </div>
                                    <span className={`text-[10px] text-slate-400 font-medium absolute -bottom-5 ${isMe ? 'right-0' : 'left-0'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                        {msg.time}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Input Area */}
                <div className="p-3 md:p-4 border-t border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
                    <div className="relative flex items-center gap-2">
                        <button className="p-2 md:p-3 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-500 transition-colors">
                            <Icon name="paperclip" className="w-5 h-5" />
                        </button>
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
            </div>
        </div>
    );
};

export default ChatPage;
