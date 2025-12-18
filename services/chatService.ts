import { db } from './firebase.ts';
import firebase from 'firebase/compat/app';
import { Timestamp, User } from '../types.ts';

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: Timestamp;
}

export interface Chat {
    id: string;
    participants: string[];
    lastMessage?: {
        text: string;
        senderId: string;
        timestamp: Timestamp;
    };
    updatedAt: Timestamp;
    participantDetails?: { // Populated client-side or via separate query
        [uid: string]: Partial<User>;
    };
}

export const chatService = {
    // Create or Get existing chat
    async getOrCreateChat(currentUserId: string, otherUserId: string): Promise<string> {
        // Deterministic ID to prevent duplicate chats
        const participants = [currentUserId, otherUserId].sort();
        const chatId = \`\${participants[0]}_\${participants[1]}\`;

    const chatRef = db.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      await chatRef.set({
        participants,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        // We can add participant info snapshot here if needed, but keeping it relational is cleaner
      });
    }

    return chatId;
  },

  // Send Message
  async sendMessage(chatId: string, senderId: string, text: string): Promise<void> {
    const chatRef = db.collection('chats').doc(chatId);
    const messagesRef = chatRef.collection('messages');

    const timestamp = firebase.firestore.FieldValue.serverTimestamp();

    await messagesRef.add({
      senderId,
      text,
      timestamp,
    });

    await chatRef.update({
      lastMessage: {
        text,
        senderId,
        timestamp,
      },
      updatedAt: timestamp,
    });
  },

  // Subscribe to My Chats
  subscribeToChats(userId: string, callback: (chats: Chat[]) => void): () => void {
    const unsubscribe = db.collection('chats')
      .where('participants', 'array-contains', userId)
      .orderBy('updatedAt', 'desc')
      .onSnapshot(snapshot => {
        const chats = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Chat));
        callback(chats);
      });
    
    return unsubscribe;
  },

  // Subscribe to Messages in a Chat
  subscribeToMessages(chatId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const unsubscribe = db.collection('chats').doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot(snapshot => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as ChatMessage));
        callback(messages);
      });

    return unsubscribe;
  },
  
  // Helper to fetch other user details (simple version)
  async fetchUserDetails(userId: string): Promise<Partial<User> | null> {
    const doc = await db.collection('users').doc(userId).get();
    if (doc.exists) {
        return doc.data() as Partial<User>;
    }
    return null;
  },

  // Search users by name
  async searchUsers(nameQuery: string): Promise<User[]> {
    // Firestore doesn't support substring search natively without external tools (Algolia etc).
    // For this demo/scale, we will fetch users and filter client side or do a prefix match.
    // Prefix match:
    const snapshot = await db.collection('users')
      .where('name', '>=', nameQuery)
      .where('name', '<=', nameQuery + '\uf8ff')
      .limit(10)
      .get();
      
    return snapshot.docs.map(doc => doc.data() as User);
  }
};
