import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

const CHAT_ROOMS_COLLECTION = "chatRooms";
const CHAT_USERS_COLLECTION = "chatUsers";
const CHAT_MESSAGES_SUBCOLLECTION = "messages";
const SYSTEM_SENDER_ID = "moveo-system";
const SYSTEM_SENDER_NAME = "MoveO";
const ROOM_ACCENT_COLORS = ["#5D5D7D", "#7B8BA6", "#4E6D68", "#8F6A5B"];

export type ChatRoom = {
  id: string;
  title: string;
  description: string;
  accentColor: string;
  rideId: number | null;
  driverId: number | null;
  driverName: string | null;
  driverAvatar: string | null;
  participantIds: string[];
  lastMessage: string;
  lastMessageSenderId: string | null;
  lastMessageSenderName: string | null;
  createdAtMs: number;
  updatedAtMs: number;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  createdAtMs: number;
  type: "system" | "user";
};

export type ChatUserProfile = {
  id: string;
  name: string;
  email?: string | null;
  avatar?: string | null;
};

const getRideChatRoomId = (rideId: number | string) => `ride-${rideId}`;

const shortenAddress = (address?: string | null) => {
  if (!address) {
    return "Unknown location";
  }

  return address.split(",").slice(0, 2).join(",").trim();
};

const getAccentColor = (driverId?: number | null) => {
  if (driverId == null) {
    return ROOM_ACCENT_COLORS[0];
  }

  return ROOM_ACCENT_COLORS[Math.abs(driverId) % ROOM_ACCENT_COLORS.length];
};

const mapChatRoom = (
  id: string,
  data: Partial<ChatRoom> & Record<string, unknown>,
): ChatRoom => ({
  id,
  title: typeof data.title === "string" ? data.title : "Untitled room",
  description:
    typeof data.description === "string" ? data.description : "No details yet.",
  accentColor:
    typeof data.accentColor === "string" ? data.accentColor : "#5D5D7D",
  rideId:
    typeof data.rideId === "number" && Number.isFinite(data.rideId)
      ? data.rideId
      : null,
  driverId:
    typeof data.driverId === "number" && Number.isFinite(data.driverId)
      ? data.driverId
      : null,
  driverName:
    typeof data.driverName === "string" ? data.driverName : "Assigned driver",
  driverAvatar:
    typeof data.driverAvatar === "string" ? data.driverAvatar : null,
  participantIds: Array.isArray(data.participantIds)
    ? data.participantIds.filter(
        (participantId): participantId is string =>
          typeof participantId === "string",
      )
    : [],
  lastMessage: typeof data.lastMessage === "string" ? data.lastMessage : "",
  lastMessageSenderId:
    typeof data.lastMessageSenderId === "string"
      ? data.lastMessageSenderId
      : null,
  lastMessageSenderName:
    typeof data.lastMessageSenderName === "string"
      ? data.lastMessageSenderName
      : null,
  createdAtMs:
    typeof data.createdAtMs === "number" && Number.isFinite(data.createdAtMs)
      ? data.createdAtMs
      : 0,
  updatedAtMs:
    typeof data.updatedAtMs === "number" && Number.isFinite(data.updatedAtMs)
      ? data.updatedAtMs
      : 0,
});

const mapChatMessage = (
  id: string,
  data: Partial<ChatMessage> & Record<string, unknown>,
): ChatMessage => ({
  id,
  roomId: typeof data.roomId === "string" ? data.roomId : "",
  text: typeof data.text === "string" ? data.text : "",
  senderId:
    typeof data.senderId === "string" ? data.senderId : SYSTEM_SENDER_ID,
  senderName:
    typeof data.senderName === "string" ? data.senderName : SYSTEM_SENDER_NAME,
  senderAvatar:
    typeof data.senderAvatar === "string" ? data.senderAvatar : null,
  createdAtMs:
    typeof data.createdAtMs === "number" && Number.isFinite(data.createdAtMs)
      ? data.createdAtMs
      : Date.now(),
  type: data.type === "system" ? "system" : "user",
});

export const syncChatUserProfile = async ({
  id,
  name,
  email,
  avatar,
}: ChatUserProfile) => {
  await setDoc(
    doc(db, CHAT_USERS_COLLECTION, id),
    {
      name,
      email: email ?? null,
      avatar: avatar ?? null,
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now(),
    },
    { merge: true },
  );
};

export const createRideChatRoom = async ({
  rideId,
  rider,
  driverId,
  driverName,
  driverAvatar,
  originAddress,
  destinationAddress,
  createdAtMs = Date.now(),
}: {
  rideId: number;
  rider: ChatUserProfile;
  driverId?: number | null;
  driverName?: string | null;
  driverAvatar?: string | null;
  originAddress?: string | null;
  destinationAddress?: string | null;
  createdAtMs?: number;
}) => {
  const roomId = getRideChatRoomId(rideId);
  const roomRef = doc(db, CHAT_ROOMS_COLLECTION, roomId);
  const roomSnapshot = await getDoc(roomRef);

  if (roomSnapshot.exists()) {
    return roomId;
  }

  const resolvedDriverName = driverName?.trim() || "your driver";
  const routeSummary = `${shortenAddress(originAddress)} to ${shortenAddress(
    destinationAddress,
  )}`;
  const welcomeMessage = `Ride booked with ${resolvedDriverName}. Use this chat for pickup notes, timing updates, and anything your driver should know before the trip starts.`;
  const participantIds = [
    rider.id,
    driverId != null ? `driver-${driverId}` : `ride-${rideId}-driver`,
  ];
  const messageRef = doc(roomRef, CHAT_MESSAGES_SUBCOLLECTION, "system-booked");
  const batch = writeBatch(db);

  batch.set(roomRef, {
    rideId,
    driverId: driverId ?? null,
    driverName: resolvedDriverName,
    driverAvatar: driverAvatar ?? null,
    participantIds,
    title: `Ride with ${resolvedDriverName}`,
    description: routeSummary,
    accentColor: getAccentColor(driverId),
    createdAt: serverTimestamp(),
    createdAtMs,
    updatedAt: serverTimestamp(),
    updatedAtMs: createdAtMs,
    lastMessage: welcomeMessage,
    lastMessageSenderId: SYSTEM_SENDER_ID,
    lastMessageSenderName: SYSTEM_SENDER_NAME,
  });

  batch.set(messageRef, {
    roomId,
    text: welcomeMessage,
    senderId: SYSTEM_SENDER_ID,
    senderName: SYSTEM_SENDER_NAME,
    senderAvatar: null,
    type: "system",
    createdAt: serverTimestamp(),
    createdAtMs,
  });

  await batch.commit();

  return roomId;
};

export const subscribeToRideChatRooms = (
  userId: string,
  onNext: (rooms: ChatRoom[]) => void,
  onError?: (error: Error) => void,
) =>
  onSnapshot(
    query(
      collection(db, CHAT_ROOMS_COLLECTION),
      where("participantIds", "array-contains", userId),
    ),
    (snapshot) => {
      const rooms = snapshot.docs
        .map((room) => mapChatRoom(room.id, room.data()))
        .sort(
          (firstRoom, secondRoom) =>
            secondRoom.updatedAtMs - firstRoom.updatedAtMs,
        );

      onNext(rooms);
    },
    (error) => {
      onError?.(error);
    },
  );

export const subscribeToRoomMessages = (
  roomId: string,
  onNext: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void,
) =>
  onSnapshot(
    query(
      collection(
        db,
        CHAT_ROOMS_COLLECTION,
        roomId,
        CHAT_MESSAGES_SUBCOLLECTION,
      ),
      orderBy("createdAtMs", "asc"),
    ),
    (snapshot) => {
      onNext(
        snapshot.docs.map((message) =>
          mapChatMessage(message.id, message.data()),
        ),
      );
    },
    (error) => {
      onError?.(error);
    },
  );

export const sendChatMessage = async ({
  roomId,
  text,
  sender,
}: {
  roomId: string;
  text: string;
  sender: ChatUserProfile;
}) => {
  const trimmedMessage = text.trim();

  if (!trimmedMessage) {
    return;
  }

  const sentAtMs = Date.now();
  const roomRef = doc(db, CHAT_ROOMS_COLLECTION, roomId);
  const messageRef = doc(collection(roomRef, CHAT_MESSAGES_SUBCOLLECTION));
  const batch = writeBatch(db);

  batch.set(messageRef, {
    roomId,
    text: trimmedMessage,
    senderId: sender.id,
    senderName: sender.name,
    senderAvatar: sender.avatar ?? null,
    type: "user",
    createdAt: serverTimestamp(),
    createdAtMs: sentAtMs,
  });

  batch.set(
    roomRef,
    {
      updatedAt: serverTimestamp(),
      updatedAtMs: sentAtMs,
      lastMessage: trimmedMessage,
      lastMessageSenderId: sender.id,
      lastMessageSenderName: sender.name,
    },
    { merge: true },
  );

  await batch.commit();
};
