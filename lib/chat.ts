import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

// 1. Create chat room when ride is booked
export const createChatRoom = async (
  rideId: string,
  userId: string,
  driverId: string
) => {
  const roomRef = doc(db, "chatRooms", `ride-${rideId}`);

  await setDoc(roomRef, {
    participants: [userId, driverId],
    createdAt: serverTimestamp(),
    lastMessage: "",
    lastMessageAt: null,
  });
};

// 2. Send message
export const sendMessage = async (
  rideId: string,
  senderId: string,
  text: string
) => {
  const roomRef = doc(db, "chatRooms", `ride-${rideId}`);
  const messagesRef = collection(roomRef, "messages");

  await addDoc(messagesRef, {
    senderId,
    text,
    createdAt: serverTimestamp(),
  });

  await updateDoc(roomRef, {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
  });
};

// 3. Subscribe to messages (realtime)
export const subscribeToMessages = (
  rideId: string,
  callback: (messages: any[]) => void
) => {
  const messagesRef = collection(
    db,
    "chatRooms",
    `ride-${rideId}`,
    "messages"
  );

  const q = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(messages);
  });
};