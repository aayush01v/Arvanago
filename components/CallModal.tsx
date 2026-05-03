import React, { useEffect, useRef, useState, useCallback } from 'react';
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

    // Ref to track the polling interval so we can clear it
    const streamPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Helper: attach local stream to the local video element and play it
    const attachLocalStream = useCallback(() => {
        if (localVideoRef.current && webrtcService.localStream) {
            if (localVideoRef.current.srcObject !== webrtcService.localStream) {
                localVideoRef.current.srcObject = webrtcService.localStream;
                localVideoRef.current.play().catch(() => {
                    // Autoplay may be blocked; this is expected on some browsers
                });
            }
        }
    }, []);

    // Helper: attach remote stream to remote video element and play it
    const attachRemoteStream = useCallback(() => {
        if (remoteVideoRef.current && webrtcService.remoteStream) {
            const tracks = webrtcService.remoteStream.getTracks();
            if (tracks.length > 0) {
                if (remoteVideoRef.current.srcObject !== webrtcService.remoteStream) {
                    remoteVideoRef.current.srcObject = webrtcService.remoteStream;
                    remoteVideoRef.current.play().catch(() => {});
                    console.log('[CallModal] Remote stream attached with', tracks.length, 'track(s)');
                    return true; // Successfully attached
                }
                // Already attached — check it still has tracks flowing
                return true;
            }
        }
        return false;
    }, []);

    // Bug 3 Fix: Poll for remote stream tracks after call setup completes.
    // The service's ontrack fires asynchronously; we need to detect when
    // remoteStream has tracks and hydrate the <video> ref.
    const startStreamPolling = useCallback(() => {
        if (streamPollRef.current) clearInterval(streamPollRef.current);

        let attempts = 0;
        const MAX_ATTEMPTS = 60; // 30 seconds at 500ms intervals

        streamPollRef.current = setInterval(() => {
            attempts++;

            // Attach local stream every tick until it is set (handles late assignment)
            attachLocalStream();

            const attached = attachRemoteStream();

            // Listen to ICE state updates and push them to UI
            const iceState = webrtcService.pc?.iceConnectionState;
            if (iceState === 'connected' || iceState === 'completed') {
                setConnectionStatus('connected');
                if (attached) {
                    // Remote stream is flowing and connected — we can stop polling
                    clearInterval(streamPollRef.current!);
                    streamPollRef.current = null;
                }
            } else if (iceState === 'failed' || iceState === 'closed') {
                setConnectionStatus('failed');
                clearInterval(streamPollRef.current!);
                streamPollRef.current = null;
            } else if (iceState === 'disconnected') {
                setConnectionStatus('reconnecting');
            } else {
                setConnectionStatus('connecting');
            }

            if (attempts >= MAX_ATTEMPTS) {
                console.warn('[CallModal] Stream poll timeout — giving up');
                clearInterval(streamPollRef.current!);
                streamPollRef.current = null;
            }
        }, 500);
    }, [attachLocalStream, attachRemoteStream]);

    const stopStreamPolling = useCallback(() => {
        if (streamPollRef.current) {
            clearInterval(streamPollRef.current);
            streamPollRef.current = null;
        }
    }, []);

    // Bug 1 & 6 Fix: This effect now handles all 4 state transitions:
    //  - Modal opens with a valid callId (normal case for callee)
    //  - Modal opens, then callId arrives later (caller optimistic-open was removed, but guard here too)
    //  - Modal closes → teardown
    useEffect(() => {
        if (isOpen) {
            // Reset UI state for a fresh call
            setConnectionStatus('connecting');
            setIsMuted(false);
            setIsVideoOff(false);
            setIsSpeakerOn(true);
            startCall();
        } else {
            stopStreamPolling();
            stopCall();
        }

        return () => {
            stopStreamPolling();
        };
    }, [isOpen, callId]); // Re-runs if callId changes while open (callee re-join edge case)

    const startCall = async () => {
        try {
            if (isCaller) {
                // Caller: createRoom was already called by ChatPage; streams are ready.
                // Just attach them to the video elements and start polling for remote.
                if (!webrtcService.localStream) {
                    // Safety fallback — shouldn't normally reach here
                    await webrtcService.openUserMedia(callType);
                }
            } else {
                // Callee: joinRoom handles openUserMedia + SDP exchange internally
                if (callId) {
                    await webrtcService.joinRoom(callId);
                } else {
                    console.warn('[CallModal] Callee startCall called without callId');
                    return;
                }
            }

            // Bug 3 Fix: Don't override pc.ontrack here — the service already set it.
            // Register the ICE state change listener on the PC for the UI state badge.
            if (webrtcService.pc) {
                webrtcService.pc.oniceconnectionstatechange = () => {
                    const state = webrtcService.pc?.iceConnectionState;
                    console.log('[CallModal] ICE state →', state);
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
            }

            // Attach local stream immediately (it exists for both caller and callee at this point)
            attachLocalStream();

            // Begin polling to attach remote stream once tracks start flowing
            startStreamPolling();

        } catch (error) {
            console.error('[CallModal] Error starting call:', error);
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
            setIsMuted(prev => !prev);
        }
    };

    const toggleVideo = () => {
        if (webrtcService.localStream) {
            webrtcService.localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(prev => !prev);
        }
    };

    const toggleSpeaker = () => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.muted = isSpeakerOn;
            setIsSpeakerOn(prev => !prev);
        }
    };

    const handleSwitchCamera = async () => {
        const newStream = await webrtcService.switchCamera();
        if (newStream && localVideoRef.current) {
            localVideoRef.current.srcObject = newStream;
        }
    };

    const handleHangUp = async () => {
        stopStreamPolling();
        try {
            await stopCall();
        } catch (e) {
            console.error("Hangup error:", e);
        }
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center sm:p-6 animate-fade-in">
            {/* Backdrop with Blur */}
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl transition-all duration-500" />

            <div className="relative w-full sm:max-w-5xl h-full sm:max-h-[85vh] bg-black/80 sm:rounded-[2.5rem] overflow-hidden shadow-2xl border-0 sm:border border-white/10 flex flex-col items-center">

                {/* Main Video Area */}
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-900">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />

                    {/* Status Check / Avatar Fallback */}
                    {connectionStatus !== 'connected' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10 transition-all">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-brand-primary/20 blur-3xl rounded-full animate-pulse-slow"></div>
                                <img
                                    src={otherUser?.avatar || 'https://i.pravatar.cc/150'}
                                    alt={otherUser?.name}
                                    className="w-32 h-32 rounded-full object-cover shadow-2xl border-4 border-white/10 relative z-10 animate-scale-in"
                                />
                                {connectionStatus === 'connecting' && (
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center border-4 border-slate-900 z-20 animate-bounce">
                                        <Icon name="loader" className="w-5 h-5 text-white animate-spin" />
                                    </div>
                                )}
                                {connectionStatus === 'failed' && (
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center border-4 border-slate-900 z-20">
                                        <Icon name="x" className="w-5 h-5 text-white" />
                                    </div>
                                )}
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">{otherUser?.name || 'Unknown User'}</h3>
                            <p className="text-white/60 text-lg font-medium animate-pulse">
                                {connectionStatus === 'connecting' && (isCaller ? 'Calling...' : 'Connecting...')}
                                {connectionStatus === 'reconnecting' && 'Reconnecting...'}
                                {connectionStatus === 'failed' && 'Connection Failed'}
                            </p>
                            {connectionStatus === 'failed' && (
                                <button
                                    onClick={handleHangUp}
                                    className="mt-6 px-6 py-3 bg-red-500 text-white rounded-full font-bold text-sm hover:bg-red-600 transition-all"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    )}

                    {/* Gradient Overlay for Controls */}
                    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
                </div>

                {/* Local Video (PiP) */}
                <div className="absolute top-6 right-6 w-28 h-40 sm:w-48 sm:h-64 bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-white/20 transition-all hover:scale-105 hover:border-brand-primary/50 group z-20">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isVideoOff || callType === 'audio' ? 'opacity-0' : 'opacity-100'}`}
                    />
                    {(isVideoOff || callType === 'audio') && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 p-4 text-center">
                            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-slate-700 flex items-center justify-center mb-2">
                                <Icon name={callType === 'audio' ? "mic" : "videoOff"} className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Header Info */}
                <div className="absolute top-6 left-6 flex items-center gap-4 z-20">
                    <button onClick={onClose} className="p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white/80 hover:text-white border border-white/10 transition-all">
                        <Icon name="minimize-2" className="w-5 h-5" />
                    </button>
                    {/* Connection status badge */}
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border transition-all ${
                        connectionStatus === 'connected' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                        connectionStatus === 'failed' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                        connectionStatus === 'reconnecting' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                        'bg-white/10 text-white/60 border-white/10'
                    }`}>
                        {connectionStatus === 'connected' ? '● Connected' :
                         connectionStatus === 'failed' ? '● Failed' :
                         connectionStatus === 'reconnecting' ? '● Reconnecting...' :
                         '● Connecting...'}
                    </div>
                </div>

                {/* Floating Controls Bar */}
                <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-6 z-30 p-2 rounded-full w-full justify-center px-4">

                    <button
                        onClick={toggleMute}
                        className={`p-4 sm:p-5 rounded-full transition-all duration-300 backdrop-blur-md shadow-lg border ${isMuted
                            ? 'bg-white text-slate-900 border-white hover:bg-slate-200'
                            : 'bg-white/10 text-white border-white/10 hover:bg-white/20 hover:scale-110'
                            }`}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        <Icon name={isMuted ? 'micOff' : 'mic'} className="w-6 h-6" />
                    </button>

                    <button
                        onClick={handleSwitchCamera}
                        disabled={callType === 'audio'}
                        className={`p-4 sm:p-5 rounded-full transition-all duration-300 backdrop-blur-md shadow-lg border bg-white/10 text-white border-white/10 hover:bg-white/20 hover:scale-110 hover:rotate-180 ${callType === 'audio' ? 'hidden' : ''}`}
                        title="Switch Camera"
                    >
                        <Icon name="refreshCw" className="w-6 h-6" />
                    </button>

                    <button
                        onClick={handleHangUp}
                        className="p-5 sm:p-6 rounded-full bg-red-500 text-white shadow-xl shadow-red-500/40 border border-red-400 hover:bg-red-600 hover:scale-110 active:scale-95 transition-all duration-300 mx-1 sm:mx-2"
                        title="End Call"
                    >
                        <Icon name="phone" className="w-8 h-8 rotate-[135deg]" />
                    </button>

                    <button
                        onClick={toggleVideo}
                        disabled={callType === 'audio'}
                        className={`p-4 sm:p-5 rounded-full transition-all duration-300 backdrop-blur-md shadow-lg border ${isVideoOff || callType === 'audio'
                            ? 'bg-white text-slate-900 border-white hover:bg-slate-200'
                            : 'bg-white/10 text-white border-white/10 hover:bg-white/20 hover:scale-110'
                            } ${callType === 'audio' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                    >
                        <Icon name={isVideoOff || callType === 'audio' ? 'videoOff' : 'video'} className="w-6 h-6" />
                    </button>

                    <button
                        onClick={toggleSpeaker}
                        className={`p-4 sm:p-5 rounded-full transition-all duration-300 backdrop-blur-md shadow-lg border ${!isSpeakerOn
                            ? 'bg-white text-slate-900 border-white hover:bg-slate-200'
                            : 'bg-white/10 text-white border-white/10 hover:bg-white/20 hover:scale-110'
                            }`}
                        title={isSpeakerOn ? "Mute Speaker" : "Unmute Speaker"}
                    >
                        <Icon name={isSpeakerOn ? 'volume' : 'volume-x'} className="w-6 h-6" />
                    </button>

                </div>
            </div>
        </div>,
        document.body
    );
};

export default CallModal;
