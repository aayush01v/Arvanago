import { db } from './firebase.ts';
import firebase from 'firebase/compat/app';
import { chatService } from './chatService';

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
};

export const webrtcService = {
    pc: null as RTCPeerConnection | null,
    localStream: null as MediaStream | null,
    remoteStream: null as MediaStream | null,
    unsubscribes: [] as (() => void)[],

    currentFacingMode: 'user' as 'user' | 'environment',

    async openUserMedia(type: 'video' | 'audio' = 'video', facingMode: 'user' | 'environment' = 'user') {
        // Cleanup existing stream if present to avoid multiple active streams
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }

        this.currentFacingMode = facingMode;
        const constraints = {
            audio: true,
            video: type === 'video' ? { facingMode } : false
        };
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.localStream = stream;
            this.remoteStream = new MediaStream();

            // Add tracks to PC
            this.localStream.getTracks().forEach(track => {
                if (this.pc && this.localStream) {
                    this.pc.addTrack(track, this.localStream);
                }
            });

            return stream;
        } catch (error: any) {
            console.error("Error accessing media devices:", error);

            // Provide user-friendly error messages
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
        if (!videoTrack) return; // Audio only or no video

        const newFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: newFacingMode },
                audio: false // We keep the existing audio track
            });

            const newVideoTrack = newStream.getVideoTracks()[0];

            // Replace track in local stream (for self view)
            this.localStream.removeTrack(videoTrack);
            this.localStream.addTrack(newVideoTrack);
            videoTrack.stop(); // Stop old track

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

    async createRoom(callerId: string, calleeId: string, type: 'video' | 'audio' = 'video', chatId?: string, messageId?: string): Promise<string> {
        if (!this.pc) this.pc = new RTCPeerConnection(servers);

        // openUserMedia will now add tracks to PC
        await this.openUserMedia(type);

        // Pull tracks from peer connection to remote stream
        this.pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
                this.remoteStream?.addTrack(track);
            });
        };

        const callDoc = db.collection('calls').doc();
        const offerCandidates = callDoc.collection('offerCandidates');
        const answerCandidates = callDoc.collection('answerCandidates');

        this.pc.onicecandidate = (event) => {
            event.candidate && offerCandidates.add(event.candidate.toJSON());
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
            status: 'ringing', // Initial status
            offer: { type: offer.type, sdp: offer.sdp },
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // Queue for candidates arriving before answer
        const candidateQueue: RTCIceCandidate[] = [];

        // Listen for remote answer AND call end
        const unsubInfo = callDoc.onSnapshot(async (snapshot) => {
            if (!snapshot.exists) {
                this.hangUp('');
                return;
            }

            const data = snapshot.data();
            // Ensure pc exists before accessing properties
            if (!this.pc) return;

            if (!this.pc.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                try {
                    await this.pc.setRemoteDescription(answerDescription);

                    // Process queued candidates
                    candidateQueue.forEach(candidate => {
                        this.pc?.addIceCandidate(candidate).catch(e => console.error("Error adding queued candidate:", e));
                    });
                    candidateQueue.length = 0;

                    // Update status when connected
                    await callDoc.update({ status: 'connected' });
                } catch (e) {
                    console.error("Error setting remote description:", e);
                }
            }
        });
        this.unsubscribes.push(unsubInfo);

        // Listen for remote ICE candidates
        const unsubIce = answerCandidates.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    if (this.pc?.currentRemoteDescription) {
                        this.pc.addIceCandidate(candidate).catch(e => console.error("Error adding candidate:", e));
                    } else {
                        candidateQueue.push(candidate);
                    }
                }
            });
        });
        this.unsubscribes.push(unsubIce);

        return callDoc.id;
    },

    async joinRoom(callId: string) {
        if (!this.pc) this.pc = new RTCPeerConnection(servers);

        const callDoc = db.collection('calls').doc(callId);
        const offerCandidates = callDoc.collection('offerCandidates');
        const answerCandidates = callDoc.collection('answerCandidates');

        // Get call data first to determine type
        const callData = (await callDoc.get()).data();
        if (!callData) throw new Error("Call data not found");

        // Initialize remote stream before setting up handlers
        this.remoteStream = new MediaStream();

        // Monitor ICE connection state for debugging and reconnection
        this.pc.oniceconnectionstatechange = () => {
            console.log('ICE Connection State:', this.pc?.iceConnectionState);
            if (this.pc?.iceConnectionState === 'failed' || this.pc?.iceConnectionState === 'disconnected') {
                console.warn('Connection issues detected, may need to reconnect');
            }
        };

        // Set up track handler to receive remote streams
        this.pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
                this.remoteStream?.addTrack(track);
            });
        };

        // Set up ICE candidate handler
        this.pc.onicecandidate = (event) => {
            event.candidate && answerCandidates.add(event.candidate.toJSON());
        };

        // Get local media BEFORE setting remote description
        const type = callData.type || 'video';
        await this.openUserMedia(type);

        // Set remote description (offer from caller)
        const offerDescription = callData.offer;
        await this.pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

        // Create and set local description (answer)
        const answerDescription = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answerDescription);

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };

        // Send answer to caller
        await callDoc.update({ answer, status: 'connected' });

        // Listen for remote ICE candidates
        const unsubIce = offerCandidates.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    this.pc?.addIceCandidate(candidate);
                }
            });
        });
        this.unsubscribes.push(unsubIce);

        // Listen for call end (Caller hangs up)
        const unsubCall = callDoc.onSnapshot((snapshot) => {
            if (!snapshot.exists) {
                // Call ended by caller
                this.hangUp(''); // Local cleanup only, as doc is gone
            }
        });
        this.unsubscribes.push(unsubCall);
    },

    async hangUp(callId: string) {
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }

        // Stop local tracks
        this.localStream?.getTracks().forEach(track => track.stop());
        this.localStream = null;
        this.remoteStream = null;

        // Unsubscribe from all listeners
        this.unsubscribes.forEach(unsubscribe => unsubscribe());
        this.unsubscribes = [];

        if (callId) {
            try {
                console.log(`[HangUp] Attempting to hang up call ${callId}`);
                const callDocRef = db.collection('calls').doc(callId);
                const callDoc = await callDocRef.get();
                const callData = callDoc.data();

                if (callData && callData.chatId && callData.messageId) {
                    console.log('[HangUp] Updating chat status:', callData.chatId, callData.messageId);
                    await chatService.updateMessage(callData.chatId, callData.messageId, { callStatus: 'ended' });
                } else {
                    console.warn('[HangUp] Missing chat/message info:', callData);
                }

                // Delete call document (in production, consider using Cloud Functions to clean up subcollections)
                await callDocRef.delete();
            } catch (error) {
                console.error("Error cleaning up call:", error);
            }
        }

        // Reload for a clean state if needed, or just handle state cleanup
        // window.location.reload(); 
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
    }
};
