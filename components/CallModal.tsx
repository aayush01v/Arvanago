import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { webrtcService } from '../services/webrtcService';
import Icon from './common/Icon';
import { User } from '../types';

interface CallModalProps {
    isOpen: boolean;
    onClose: () => void;
    callId: string | null;
    isCaller: boolean;
    otherUser: Partial<User> | null;
    callType?: 'video' | 'audio';
}

const CallModal: React.FC<CallModalProps> = ({ isOpen, onClose, callId, isCaller, otherUser, callType = 'video' }) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'reconnecting' | 'failed'>('connecting');

    useEffect(() => {
        if (isOpen && callId) {
            startCall();
        } else {
            stopCall();
        }
    }, [isOpen, callId]);

    const startCall = async () => {
        try {
            // Handle Caller vs Callee logic
            if (isCaller) {
                // For caller, stream should be ready in service
                if (!webrtcService.localStream) {
                    // Fallback if not ready
                    await webrtcService.openUserMedia(callType);
                }
            } else {
                // For callee, we MUST join the room. joinRoom handles openUserMedia internally
                if (callId) await webrtcService.joinRoom(callId);
            }

            // Attach Streams to Video Elements with defensive checks
            if (webrtcService.localStream && localVideoRef.current) {
                localVideoRef.current.srcObject = webrtcService.localStream;
            }

            if (webrtcService.remoteStream && remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = webrtcService.remoteStream;
            }

            // Setup listener for remote track events (in case they arrive later)
            if (webrtcService.pc) {
                // Monitor connection state
                webrtcService.pc.oniceconnectionstatechange = () => {
                    const state = webrtcService.pc?.iceConnectionState;
                    console.log('ICE Connection State:', state);

                    if (state === 'connected' || state === 'completed') {
                        setConnectionStatus('connected');
                    } else if (state === 'checking' || state === 'new') {
                        setConnectionStatus('connecting');
                    } else if (state === 'disconnected') {
                        setConnectionStatus('reconnecting');
                    } else if (state === 'failed' || state === 'closed') {
                        setConnectionStatus('failed');
                    }
                };

                webrtcService.pc.ontrack = (event) => {
                    event.streams[0].getTracks().forEach((track) => {
                        // Ensure remoteStream exists
                        if (webrtcService.remoteStream) {
                            webrtcService.remoteStream.addTrack(track);
                        }
                    });

                    // Force update remote video ref
                    if (remoteVideoRef.current && webrtcService.remoteStream) {
                        remoteVideoRef.current.srcObject = webrtcService.remoteStream;
                    }
                };
            }
        } catch (error) {
            console.error('Error starting call:', error);
            setConnectionStatus('failed');
        }
    };

    const stopCall = async () => {
        await webrtcService.hangUp(callId || '');
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };

    const toggleMute = () => {
        if (webrtcService.localStream) {
            webrtcService.localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (webrtcService.localStream) {
            webrtcService.localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    const toggleSpeaker = () => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.muted = isSpeakerOn; // If currently on, we mute it (so muted = true)
            setIsSpeakerOn(!isSpeakerOn);
        }
    };

    const handleSwitchCamera = async () => {
        const newStream = await webrtcService.switchCamera();
        if (newStream && localVideoRef.current) {
            localVideoRef.current.srcObject = newStream;
        }
    };

    const handleHangUp = async () => {
        // We await stopCall to ensure cleanup, but we catch errors so the modal ALWAYS closes.
        try {
            await stopCall();
        } catch (e) {
            console.error("Hangup error:", e);
        }
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center">

            <div className="relative w-full max-w-4xl h-full max-h-[80vh] bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
                {/* Remote Video (Main) */}
                <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 text-white text-shadow">
                        <h3 className="font-bold text-lg">{otherUser?.name || 'Unknown User'}</h3>
                        <div className="flex items-center gap-2">
                            <p className="text-sm opacity-80">
                                {connectionStatus === 'connecting' && (isCaller ? 'Calling...' : 'Connecting...')}
                                {connectionStatus === 'connected' && 'Connected'}
                                {connectionStatus === 'reconnecting' && 'Reconnecting...'}
                                {connectionStatus === 'failed' && 'Connection Failed'}
                            </p>
                            {connectionStatus === 'connected' && (
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Local Video (PiP) */}
                <div className="absolute top-4 right-4 w-32 h-48 md:w-48 md:h-72 bg-slate-800 rounded-xl overflow-hidden shadow-lg border-2 border-white/20">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoOff || callType === 'audio' ? 'hidden' : ''}`}
                    />
                    {(isVideoOff || callType === 'audio') && (
                        <div className="w-full h-full flex items-center justify-center text-white/50 flex-col gap-2">
                            <img src={otherUser?.avatar || 'https://i.pravatar.cc/150'} className="w-16 h-16 rounded-full opacity-50" />
                            {callType === 'audio' && <span className="text-xs">Audio Call</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="mt-8 flex items-center gap-6">
                <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    <Icon name={isMuted ? 'micOff' : 'mic'} className="w-6 h-6" />
                </button>

                <button
                    onClick={handleSwitchCamera}
                    disabled={callType === 'audio'}
                    className={`p-4 rounded-full transition-all bg-white/10 text-white hover:bg-white/20 transform hover:rotate-180 ${callType === 'audio' ? 'hidden' : ''}`}
                >
                    <Icon name="refreshCw" className="w-6 h-6" />
                </button>

                <button
                    onClick={handleHangUp}
                    className="p-5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all transform hover:scale-110 shadow-lg shadow-red-500/50"
                >
                    <Icon name="phone" className="w-8 h-8 rotate-[135deg]" />
                </button>

                <button
                    onClick={toggleSpeaker}
                    className={`p-4 rounded-full transition-all ${isSpeakerOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-black'}`}
                >
                    <Icon name={isSpeakerOn ? 'volume' : 'volume-x'} className="w-6 h-6" />
                </button>

                <button
                    onClick={toggleVideo}
                    disabled={callType === 'audio'}
                    className={`p-4 rounded-full transition-all ${isVideoOff || callType === 'audio' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'} ${callType === 'audio' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Icon name={isVideoOff || callType === 'audio' ? 'videoOff' : 'video'} className="w-6 h-6" />
                </button>
            </div>
        </div>,
        document.body
    );
};

export default CallModal;
