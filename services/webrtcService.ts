import { db } from './firebase.ts';
import firebase from 'firebase/compat/app';
import { chatService } from './chatService';

// Bug 7 Fix: Add TURN servers alongside STUN so calls work across different networks/NATs
const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
        // Free public TURN fallback via Open Relay — handles symmetric NATs
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
    ],
    iceCandidatePoolSize: 10,
};

export const webrtcService = {
    pc: null as RTCPeerConnection | null,
    localStream: null as MediaStream | null,
    remoteStream: null as MediaStream | null,
    unsubscribes: [] as (() => void)[],

    // Pending ICE candidate batch timers, cleared on cleanup so they can't
    // fire and write to Firestore after the call doc is deleted
    iceBatchTimers: [] as ReturnType<typeof setTimeout>[],

    // UI callback for ICE connection state changes. The UI must use this
    // instead of overwriting pc.oniceconnectionstatechange, which the
    // service registers itself.
    onIceStateChange: null as ((state: RTCIceConnectionState) => void) | null,

    currentFacingMode: 'user' as 'user' | 'environment',

    async openUserMedia(type: 'video' | 'audio' = 'video', facingMode: 'user' | 'environment' = 'user') {
        // Cleanup existing stream if present to avoid multiple active streams
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        this.currentFacingMode = facingMode;
        const constraints = {
            audio: { echoCancellation: true, noiseSuppression: true },
            video: type === 'video' ? { 
                facingMode,
                width: { ideal: 640, max: 1280 },
                height: { ideal: 480, max: 720 },
                frameRate: { ideal: 24, max: 30 }
            } : false
        };
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.localStream = stream;

            // Add tracks to the PeerConnection if it already exists
            // (PC is created before openUserMedia is called in createRoom/joinRoom)
            if (this.pc) {
                stream.getTracks().forEach(track => {
                    this.pc!.addTrack(track, stream);
                });
            }

            return stream;
        } catch (error: any) {
            console.error("Error accessing media devices:", error);

            if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                throw new Error("No camera or microphone found. Please ensure your devices are connected.");
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                throw new Error("Camera/microphone access denied. Please allow permissions in your browser settings.");
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                throw new Error("Camera/microphone is already in use by another application. Please close other apps and try again.");
            } else if (error.name === 'OverconstrainedError') {
                throw new Error("Camera/microphone doesn't meet requirements. Please check your device settings.");
            } else {
                throw new Error("Failed to access camera/microphone. Please check your device and try again.");
            }
        }
    },

    async switchCamera() {
        if (!this.localStream) return;

        const videoTrack = this.localStream.getVideoTracks()[0];
        if (!videoTrack) return;

        const newFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: newFacingMode },
                audio: false
            });

            const newVideoTrack = newStream.getVideoTracks()[0];

            // Replace track in local stream (for self view)
            this.localStream.removeTrack(videoTrack);
            this.localStream.addTrack(newVideoTrack);
            videoTrack.stop();

            // Replace track in PeerConnection (for remote view)
            if (this.pc) {
                const sender = this.pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    await sender.replaceTrack(newVideoTrack);
                }
            }

            this.currentFacingMode = newFacingMode;
            return this.localStream;
        } catch (error) {
            console.error("Error switching camera:", error);
            throw error;
        }
    },

    // Bug 5 Fix: Internal helper that tears down any existing connection cleanly
    // without touching Firestore — used before starting a fresh call
    _cleanupLocal() {
        if (this.pc) {
            this.pc.ontrack = null;
            this.pc.onicecandidate = null;
            this.pc.oniceconnectionstatechange = null;
            this.pc.onconnectionstatechange = null;
            this.pc.close();
            this.pc = null;
        }
        if (this.localStream) {
            this.localStream.getTracks().forEach(t => t.stop());
            this.localStream = null;
        }
        this.remoteStream = null;
        this.unsubscribes.forEach(u => u());
        this.unsubscribes = [];
        this.iceBatchTimers.forEach(t => clearTimeout(t));
        this.iceBatchTimers = [];
    },

    async createRoom(callerId: string, calleeId: string, type: 'video' | 'audio' = 'video', chatId?: string, messageId?: string): Promise<string> {
        // Bug 5 Fix: Clean up any stale state from a previous call
        this._cleanupLocal();

        this.pc = new RTCPeerConnection(servers);

        // Bug 6 Fix: Initialize remoteStream and set ontrack BEFORE openUserMedia
        // so we never miss a track event triggered during negotiation
        this.remoteStream = new MediaStream();

        this.pc.ontrack = (event) => {
            console.log('[Caller] ontrack fired, streams:', event.streams.length);

            // Some browsers can fire ontrack with an empty streams[] array.
            // Fall back to the track itself so remote audio/video still renders.
            if (event.streams[0]) {
                event.streams[0].getTracks().forEach((track) => {
                    this.remoteStream?.addTrack(track);
                });
                return;
            }

            this.remoteStream?.addTrack(event.track);
        };

        // Now open media & add local tracks to the PC
        await this.openUserMedia(type);

        const callDoc = db.collection('calls').doc();
        const offerCandidates = callDoc.collection('offerCandidates');
        const answerCandidates = callDoc.collection('answerCandidates');

        let candidateBatch: RTCIceCandidateInit[] = [];
        let batchTimeout: NodeJS.Timeout | null = null;

        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[Caller] Queuing ICE candidate');
                candidateBatch.push(event.candidate.toJSON());
                
                if (!batchTimeout) {
                    batchTimeout = setTimeout(async () => {
                        const batchToCommit = candidateBatch;
                        candidateBatch = [];
                        batchTimeout = null;
                        
                        if (batchToCommit.length > 0) {
                            try {
                                const dbBatch = db.batch();
                                batchToCommit.forEach(candidate => {
                                    dbBatch.set(offerCandidates.doc(), candidate);
                                });
                                await dbBatch.commit();
                                console.log(`[Caller] Batched ${batchToCommit.length} ICE candidates`);
                            } catch (e) {
                                console.error('[Caller] Error committing ICE batch:', e);
                            }
                        }
                    }, 300); // Wait 300ms to gather multiple candidates
                    this.iceBatchTimers.push(batchTimeout);
                }
            }
        };

        this.pc.oniceconnectionstatechange = () => {
            const state = this.pc?.iceConnectionState;
            console.log('[Caller] ICE state:', state);
            if (state) this.onIceStateChange?.(state);
        };

        this.pc.onconnectionstatechange = () => {
            console.log('[Caller] Connection state:', this.pc?.connectionState);
        };

        const offerDescription = await this.pc.createOffer();
        await this.pc.setLocalDescription(offerDescription);

        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };

        await callDoc.set({
            callerId,
            calleeId,
            type,
            chatId: chatId || null,
            messageId: messageId || null,
            status: 'ringing',
            offer: { type: offer.type, sdp: offer.sdp },
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // Queue for answer-side ICE candidates arriving before answer SDP is set
        const candidateQueue: RTCIceCandidate[] = [];
        let lastProcessedAnswer = '';

        // Listen for remote answer
        const unsubInfo = callDoc.onSnapshot(async (snapshot) => {
            if (!snapshot.exists) {
                this.hangUp('');
                return;
            }

            const data = snapshot.data();
            if (!this.pc) return;

            if (!this.pc.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                try {
                    await this.pc.setRemoteDescription(answerDescription);
                    console.log('[Caller] Remote description set (answer)');

                    // Flush queued candidates
                    for (const candidate of candidateQueue) {
                        await this.pc.addIceCandidate(candidate).catch(e =>
                            console.error("[Caller] Error adding queued candidate:", e)
                        );
                    }
                    candidateQueue.length = 0;

                    await callDoc.update({ status: 'connected' });
                } catch (e) {
                    console.error("[Caller] Error setting remote description:", e);
                }
            } else if (data?.renegotiationAnswer && data.renegotiationAnswer.sdp !== lastProcessedAnswer) {
                lastProcessedAnswer = data.renegotiationAnswer.sdp;
                console.log('[Caller] Renegotiation Answer Received');
                try {
                    await this.pc.setRemoteDescription(new RTCSessionDescription(data.renegotiationAnswer));
                } catch (e) {
                    console.error("[Caller] Error setting renegotiation answer:", e);
                }
            }
        });
        this.unsubscribes.push(unsubInfo);

        // Listen for remote ICE candidates (from callee)
        const unsubIce = answerCandidates.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    if (this.pc?.currentRemoteDescription) {
                        this.pc.addIceCandidate(candidate).catch(e =>
                            console.error("[Caller] Error adding candidate:", e)
                        );
                    } else {
                        // Buffer until remote description is set
                        candidateQueue.push(candidate);
                    }
                }
            });
        });
        this.unsubscribes.push(unsubIce);

        return callDoc.id;
    },

    async joinRoom(callId: string) {
        // Bug 5 Fix: Clean up any stale state
        this._cleanupLocal();

        this.pc = new RTCPeerConnection(servers);

        const callDoc = db.collection('calls').doc(callId);
        const offerCandidates = callDoc.collection('offerCandidates');
        const answerCandidates = callDoc.collection('answerCandidates');

        const callSnap = await callDoc.get();
        const callData = callSnap.data();
        if (!callData) throw new Error("Call data not found");

        // Bug 6 Fix: Set up remoteStream and ontrack BEFORE any SDP work
        this.remoteStream = new MediaStream();

        this.pc.ontrack = (event) => {
            console.log('[Callee] ontrack fired, streams:', event.streams.length);

            // Some browsers can fire ontrack with an empty streams[] array.
            // Fall back to the track itself so remote audio/video still renders.
            if (event.streams[0]) {
                event.streams[0].getTracks().forEach((track) => {
                    this.remoteStream?.addTrack(track);
                });
                return;
            }

            this.remoteStream?.addTrack(event.track);
        };

        this.pc.oniceconnectionstatechange = () => {
            const state = this.pc?.iceConnectionState;
            console.log('[Callee] ICE state:', state);
            if (state) this.onIceStateChange?.(state);
        };

        this.pc.onconnectionstatechange = () => {
            console.log('[Callee] Connection state:', this.pc?.connectionState);
        };

        let candidateBatch: RTCIceCandidateInit[] = [];
        let batchTimeout: NodeJS.Timeout | null = null;

        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[Callee] Queuing ICE candidate');
                candidateBatch.push(event.candidate.toJSON());
                
                if (!batchTimeout) {
                    batchTimeout = setTimeout(async () => {
                        const batchToCommit = candidateBatch;
                        candidateBatch = [];
                        batchTimeout = null;
                        
                        if (batchToCommit.length > 0) {
                            try {
                                const dbBatch = db.batch();
                                batchToCommit.forEach(candidate => {
                                    dbBatch.set(answerCandidates.doc(), candidate);
                                });
                                await dbBatch.commit();
                                console.log(`[Callee] Batched ${batchToCommit.length} ICE candidates`);
                            } catch (e) {
                                console.error('[Callee] Error committing ICE batch:', e);
                            }
                        }
                    }, 300); // Wait 300ms to gather multiple candidates
                    this.iceBatchTimers.push(batchTimeout);
                }
            }
        };

        // Bug 4 Fix: Queue ICE candidates from the caller that arrive before
        // setRemoteDescription + setLocalDescription are complete
        const candidateQueue: RTCIceCandidate[] = [];
        let remoteDescriptionSet = false;

        // Start listening for offer-side ICE candidates immediately (they may arrive fast)
        const unsubIce = offerCandidates.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    if (remoteDescriptionSet && this.pc) {
                        this.pc.addIceCandidate(candidate).catch(e =>
                            console.error("[Callee] Error adding candidate:", e)
                        );
                    } else {
                        candidateQueue.push(candidate);
                    }
                }
            });
        });
        this.unsubscribes.push(unsubIce);

        // Get local media BEFORE setting remote description (so our tracks exist)
        const type = callData.type || 'video';
        await this.openUserMedia(type);

        // Set remote description (caller's offer)
        const offerDescription = callData.offer;
        await this.pc.setRemoteDescription(new RTCSessionDescription(offerDescription));
        console.log('[Callee] Remote description set (offer)');

        // Create and set local description (our answer)
        const answerDescription = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answerDescription);
        console.log('[Callee] Local description set (answer)');

        // Now flush queued offer-side candidates
        remoteDescriptionSet = true;
        for (const candidate of candidateQueue) {
            await this.pc.addIceCandidate(candidate).catch(e =>
                console.error("[Callee] Error adding queued candidate:", e)
            );
        }
        candidateQueue.length = 0;

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };

        // Send answer back to caller
        await callDoc.update({ answer, status: 'connected' });
        console.log('[Callee] Answer sent, status=connected');

        let lastProcessedOffer = '';
        // Listen for call document deletion and renegotiation offers
        const unsubCall = callDoc.onSnapshot(async (snapshot) => {
            if (!snapshot.exists) {
                this.hangUp('');
                return;
            }
            const data = snapshot.data();
            if (data?.renegotiationOffer && data.renegotiationOffer.sdp !== lastProcessedOffer) {
                lastProcessedOffer = data.renegotiationOffer.sdp;
                console.log('[Callee] Renegotiation Offer Received');
                if (this.pc) {
                    try {
                        await this.pc.setRemoteDescription(new RTCSessionDescription(data.renegotiationOffer));
                        const answer = await this.pc.createAnswer();
                        await this.pc.setLocalDescription(answer);
                        await callDoc.update({
                            renegotiationAnswer: { type: answer.type, sdp: answer.sdp }
                        });
                    } catch(e) {
                        console.error("[Callee] Error processing renegotiation:", e);
                    }
                }
            }
        });
        this.unsubscribes.push(unsubCall);
    },

    async hangUp(callId: string, reason: 'ended' | 'missed' | 'declined' = 'ended') {
        console.log('[HangUp] Cleaning up, callId:', callId, 'reason:', reason);

        this.unsubscribes.forEach(unsubscribe => unsubscribe());
        this.unsubscribes = [];

        // Cancel pending ICE batch timers so they can't write after the doc is deleted
        this.iceBatchTimers.forEach(t => clearTimeout(t));
        this.iceBatchTimers = [];

        if (this.pc) {
            this.pc.ontrack = null;
            this.pc.onicecandidate = null;
            this.pc.oniceconnectionstatechange = null;
            this.pc.onconnectionstatechange = null;
            this.pc.close();
            this.pc = null;
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        this.remoteStream = null;

        if (callId) {
            try {
                const callDocRef = db.collection('calls').doc(callId);
                const callDoc = await callDocRef.get();
                const callData = callDoc.data();

                if (callData?.chatId && callData?.messageId) {
                    await chatService.updateMessage(callData.chatId, callData.messageId, { callStatus: reason });
                } else {
                    console.warn('[HangUp] Missing chat/message info:', callData);
                }

                await callDocRef.delete();
            } catch (error) {
                console.error("Error cleaning up call:", error);
            }
        }
    },

    listenForIncomingCalls(userId: string, callback: (callId: string, data: any) => void) {
        return db.collection('calls')
            .where('calleeId', '==', userId)
            .where('status', '==', 'ringing')
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        callback(change.doc.id, change.doc.data());
                    }
                });
            });
    },

    async updateCall(callId: string, updates: any) {
        await db.collection('calls').doc(callId).update(updates);
    },

    // --- Video Upgrade Methods ---
    async requestVideoUpgrade(callId: string, requestedBy: string) {
        await db.collection('calls').doc(callId).update({
            upgradeToVideo: { status: 'pending', requestedBy }
        });
    },

    async respondToVideoUpgrade(callId: string, status: 'accepted' | 'rejected') {
        await db.collection('calls').doc(callId).update({
            'upgradeToVideo.status': status
        });
    },

    async addVideoTrack(callId: string, isCaller: boolean) {
        if (!this.pc) return null;
        try {
            // Video only: the call already has an audio track. Requesting audio
            // here leaked a second, unused microphone capture.
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } }
            });
            const videoTrack = stream.getVideoTracks()[0];
            
            // Add track to local stream for UI
            if (this.localStream) {
                this.localStream.addTrack(videoTrack);
            } else {
                this.localStream = stream;
            }
            
            // Add track to PeerConnection
            this.pc.addTrack(videoTrack, this.localStream);

            // Caller drives renegotiation
            if (isCaller) {
                const offer = await this.pc.createOffer();
                await this.pc.setLocalDescription(offer);
                await db.collection('calls').doc(callId).update({
                    renegotiationOffer: { type: offer.type, sdp: offer.sdp },
                    renegotiationAnswer: firebase.firestore.FieldValue.delete()
                });
            }
            
            return videoTrack;
        } catch (e) {
            console.error("Error adding video track:", e);
            throw e;
        }
    }
};
