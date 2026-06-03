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
// Enriched chat room creation — replaces the stub call in Payment.tsx
export const createRideChatRoom = async (args: {
  rideId: number;
  rider: { id: string; name: string; email: string };
  driverId: number;
  driverName: string;
  driverAvatar?: string;
  originAddress: string;
  destinationAddress: string;
  createdAtMs: number;
}) => {
  const roomRef = doc(db, "chatRooms", `ride-${args.rideId}`);
  await setDoc(
    roomRef,
    {
      participants: [args.rider.id, `driver-${args.driverId}`],
      rideId: args.rideId,
      rider: args.rider,
      driverId: args.driverId,
      driverName: args.driverName,
      driverAvatar: args.driverAvatar ?? null,
      originAddress: args.originAddress,
      destinationAddress: args.destinationAddress,
      createdAt: serverTimestamp(),
      createdAtMs: args.createdAtMs,
      lastMessage: "",
      lastMessageAt: null,
    },
    { merge: true }
  );
};

// Optional: typing indicator (driver "is typing...")
export const setDriverTyping = async (rideId: string | number, isTyping: boolean) => {
  const roomRef = doc(db, "chatRooms", `ride-${rideId}`);
  await updateDoc(roomRef, { driverTyping: isTyping });
};

// 3. Subscribe to messages in a ride chat room (real-time)
export const subscribeToMessages = (
  rideId: string,
  onNext: (messages: { id: string; senderId: string; text: string; createdAt: unknown }[]) => void,
) => {
  const messagesRef = collection(db, "chatRooms", `ride-${rideId}`, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map((d) => ({
      id: d.id,
      senderId: d.data().senderId as string,
      text: d.data().text as string,
      createdAt: d.data().createdAt ?? null,
    }));
    onNext(msgs);
  });
};

// 4. Send a message to a ride chat room
export const sendMessage = async (
  rideId: string,
  senderId: string,
  text: string,
) => {
  const messagesRef = collection(db, "chatRooms", `ride-${rideId}`, "messages");
  await addDoc(messagesRef, {
    senderId,
    text,
    createdAt: serverTimestamp(),
  });

  // Keep the chat room's lastMessage up-to-date
  const roomRef = doc(db, "chatRooms", `ride-${rideId}`);
  await updateDoc(roomRef, {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
  });
};