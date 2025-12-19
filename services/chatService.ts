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
  unreadCounts?: {
    [uid: string]: number;
  };
}

export const chatService = {
  // Create or Get existing chat
  async getOrCreateChat(currentUserId: string, otherUserId: string): Promise<string> {
    // Deterministic ID to prevent duplicate chats
    const participants = [currentUserId, otherUserId].sort();
    const chatId = `${participants[0]}_${participants[1]}`;

    const chatRef = db.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      await chatRef.set({
        participants,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        unreadCounts: {
          [currentUserId]: 0,
          [otherUserId]: 0
        }
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

    // Get current chat to know participants
    const chatDoc = await chatRef.get();
    const chatData = chatDoc.data() as Chat;
    const participants = chatData?.participants || [];
    const otherUserId = participants.find(p => p !== senderId);

    const updates: any = {
      lastMessage: {
        text,
        senderId,
        timestamp,
      },
      updatedAt: timestamp,
      [`lastRead.${senderId}`]: timestamp // Sender has read their own message
    };

    if (otherUserId) {
      updates[`unreadCounts.${otherUserId}`] = firebase.firestore.FieldValue.increment(1);
    }

    await chatRef.update(updates);
  },

  // Mark chat as read
  async markChatRead(chatId: string, userId: string): Promise<void> {
    const chatRef = db.collection('chats').doc(chatId);
    await chatRef.update({
      [`lastRead.${userId}`]: firebase.firestore.FieldValue.serverTimestamp(),
      [`unreadCounts.${userId}`]: 0
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
    // Prefix match on Name
    const nameSnapshotPromise = db.collection('users')
      .where('name', '>=', nameQuery)
      .where('name', '<=', nameQuery + '\uf8ff')
      .limit(10)
      .get();

    // Prefix match on Username
    const usernameSnapshotPromise = db.collection('users')
      .where('username', '>=', nameQuery)
      .where('username', '<=', nameQuery + '\uf8ff')
      .limit(10)
      .get();

    try {
      const [nameSnapshot, usernameSnapshot] = await Promise.all([nameSnapshotPromise, usernameSnapshotPromise]);

      const usersMap = new Map<string, User>();

      nameSnapshot.docs.forEach(doc => {
        const data = doc.data() as User;
        usersMap.set(data.uid, data);
      });

      usernameSnapshot.docs.forEach(doc => {
        const data = doc.data() as User;
        usersMap.set(data.uid, data);
      });

      return Array.from(usersMap.values());
    } catch (e) {
      console.error("Error searching users:", e);
      return [];
    }
  }
};
