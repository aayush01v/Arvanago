import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { webrtcService } from '../services/webrtcService';
import { User } from '../types';
import Icon from './common/Icon';
import CallModal from './CallModal';
import { chatService } from '../services/chatService';

interface IncomingCallListenerProps {
    currentUser: User | null;
}

const IncomingCallListener: React.FC<IncomingCallListenerProps> = ({ currentUser }) => {
    const [incomingCall, setIncomingCall] = useState<{ id: string, data: any } | null>(null);
    const [caller, setCaller] = useState<Partial<User> | null>(null);
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = webrtcService.listenForIncomingCalls(currentUser.uid, async (callId, data) => {
            // Check if we already have this call or if it's too old
            const now = Date.now();
            const callTime = data.timestamp?.toMillis() || now;
            if (now - callTime > 60000) return; // Ignore calls older than 60s

            // Fetch caller details
            if (data.callerId) {
                const callerDetails = await chatService.fetchUserDetails(data.callerId);
                setCaller(callerDetails);
            }

            setIncomingCall({ id: callId, data });
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleDecline = async () => {
        if (incomingCall) {
            // Mark the linked chat message as declined so the caller sees the outcome
            await webrtcService.hangUp(incomingCall.id, 'declined');
            setIncomingCall(null);
            setCaller(null);
        }
    };

    const [activeCallId, setActiveCallId] = useState<string | null>(null);
    const [activeCallType, setActiveCallType] = useState<'video' | 'audio'>('video');

    const onAnswerWrapper = () => {
        if (incomingCall) {
            setActiveCallId(incomingCall.id);
            setActiveCallType(incomingCall.data.type || 'video');
            setIsCallModalOpen(true);
            setIncomingCall(null);
        }
    }

    return (
        <>
            {/* Incoming Call Notification (Toast) */}
            {incomingCall && !isCallModalOpen && (
                createPortal(
                    <div className="fixed top-4 right-4 z-[10000] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 animate-fade-in-down w-80">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <img src={caller?.avatar || 'https://i.pravatar.cc/150'} className="w-12 h-12 rounded-full object-cover" />
                                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 animate-pulse">
                                    <Icon name="phone" className="w-3 h-3 text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 dark:text-white">{caller?.name || 'Unknown'}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Incoming {incomingCall.data.type || 'Video'} Call...</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <button
                                onClick={handleDecline}
                                className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-bold text-xs transition-colors"
                            >
                                Decline
                            </button>
                            <button
                                onClick={onAnswerWrapper}
                                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-xs transition-colors shadow-lg shadow-green-500/20"
                            >
                                Answer
                            </button>
                        </div>
                    </div>,
                    document.body
                )
            )}

            {/* Active Call Modal (Global for Receiver) */}
            <CallModal
                isOpen={isCallModalOpen}
                onClose={() => {
                    setIsCallModalOpen(false);
                    setActiveCallId(null);
                    setCaller(null);
                }}
                callId={activeCallId}
                isCaller={false} // Receiver
                otherUser={caller}
                callType={activeCallType}
            />
        </>
    );
};

export default IncomingCallListener;
