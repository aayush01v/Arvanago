import { db } from './firebase.ts';
import firebase from 'firebase/compat/app';

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

    currentFacingMode: 'user' as 'user' | 'environment',

    async openUserMedia(type: 'video' | 'audio' = 'video', facingMode: 'user' | 'environment' = 'user') {
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
            if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                throw new Error("No camera or microphone found. Please ensure your devices are connected.");
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                throw new Error("Permission to access camera/microphone was denied.");
            } else {
                throw error;
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

    async createRoom(callerId: string, calleeId: string, type: 'video' | 'audio' = 'video'): Promise<string> {
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
            status: 'ringing', // Initial status
            offer: { type: offer.type, sdp: offer.sdp },
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // Listen for remote answer
        callDoc.onSnapshot((snapshot) => {
            const data = snapshot.data();
            if (!this.pc?.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                this.pc.setRemoteDescription(answerDescription);
            }
        });

        // Listen for remote ICE candidates
        answerCandidates.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    this.pc?.addIceCandidate(candidate);
                }
            });
        });

        return callDoc.id;
    },

    async joinRoom(callId: string) {
        if (!this.pc) this.pc = new RTCPeerConnection(servers);

        // openUserMedia will now add tracks to PC
        // this.localStream?.getTracks().forEach((track) => {
        //     if (this.pc && this.localStream) {
        //         this.pc.addTrack(track, this.localStream);
        //     }
        // });

        this.pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
                this.remoteStream?.addTrack(track);
            });
        };

        const callDoc = db.collection('calls').doc(callId);
        const offerCandidates = callDoc.collection('offerCandidates');
        const answerCandidates = callDoc.collection('answerCandidates');

        this.pc.onicecandidate = (event) => {
            event.candidate && answerCandidates.add(event.candidate.toJSON());
        };

        const callData = (await callDoc.get()).data();
        if (!callData) throw new Error("Call data not found")

        // Determine type from call data to open correct media
        const type = callData.type || 'video';
        await this.openUserMedia(type);

        const offerDescription = callData.offer;
        await this.pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

        const answerDescription = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answerDescription);

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };

        await callDoc.update({ answer });

        offerCandidates.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    this.pc?.addIceCandidate(candidate);
                }
            });
        });
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

        if (callId) {
            // In a real app, delete subcollections too (via batch or Cloud Function)
            await db.collection('calls').doc(callId).delete();
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
    }
};
