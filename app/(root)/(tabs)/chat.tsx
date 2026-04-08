import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ChatMessage,
  ChatRoom,
  createRideChatRoom,
  sendChatMessage,
  subscribeToRideChatRooms,
  subscribeToRoomMessages,
  syncChatUserProfile,
} from "@/lib/chat";
import { fetchAPI } from "@/lib/fetch";

const formatRelativeLabel = (timestamp: number) => {
  if (!timestamp) {
    return "Just now";
  }

  const date = new Date(timestamp);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();

  if (isSameDay) {
    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const getDisplayName = (
  fullName?: string | null,
  username?: string | null,
  email?: string | null,
) => {
  if (fullName?.trim()) {
    return fullName.trim();
  }

  if (username?.trim()) {
    return username.trim();
  }

  if (email?.trim()) {
    return email.split("@")[0];
  }

  return "MoveO Rider";
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const AvatarBadge = ({
  name,
  imageUrl,
  size = 42,
  backgroundColor = "#D6D6E0",
  textColor = "#2F2F42",
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
}) => {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
      />
    );
  }

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor }}
    >
      <Text className="text-sm font-JakartaBold" style={{ color: textColor }}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const RoomChip = ({
  room,
  selected,
  onPress,
}: {
  room: ChatRoom;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.9}
    className="mr-3 rounded-[24px] border px-4 py-4"
    onPress={onPress}
    style={{
      width: 220,
      backgroundColor: selected ? room.accentColor : "#F3F3F7",
      borderColor: selected ? room.accentColor : "#E4E4ED",
    }}
  >
    <View className="flex-row items-center justify-between">
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{
          backgroundColor: selected
            ? "rgba(255,255,255,0.18)"
            : room.accentColor,
        }}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={18}
          color={selected ? "#FFFFFF" : "#FFFFFF"}
        />
      </View>

      <Text
        className="text-xs font-JakartaMedium"
        style={{ color: selected ? "#E5E7F0" : "#747490" }}
      >
        {formatRelativeLabel(room.updatedAtMs)}
      </Text>
    </View>

    <Text
      className="mt-4 text-base font-JakartaBold"
      style={{ color: selected ? "#FFFFFF" : "#2F2F42" }}
    >
      {room.title}
    </Text>

    <Text
      className="mt-2 text-sm leading-5 font-JakartaRegular"
      style={{ color: selected ? "#F3F3F7" : "#46466B" }}
      numberOfLines={2}
    >
      {room.lastMessage || room.description}
    </Text>
  </TouchableOpacity>
);

const MessageBubble = ({
  message,
  isCurrentUser,
}: {
  message: ChatMessage;
  isCurrentUser: boolean;
}) => {
  if (message.type === "system") {
    return (
      <View className="my-2 items-center">
        <View className="rounded-full bg-[#D6D6E0] px-4 py-2">
          <Text className="text-center text-xs text-[#46466B] font-JakartaMedium">
            {message.text}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`mb-4 ${isCurrentUser ? "items-end" : "items-start"}`}>
      {!isCurrentUser ? (
        <Text className="mb-2 ml-1 text-xs text-[#747490] font-JakartaMedium">
          {message.senderName}
        </Text>
      ) : null}

      <View
        className={`rounded-[24px] px-4 py-3 ${
          isCurrentUser ? "bg-[#5D5D7D]" : "bg-[#FFFFFF]"
        }`}
        style={{
          maxWidth: "82%",
          borderWidth: isCurrentUser ? 0 : 1,
          borderColor: "#ECECF2",
        }}
      >
        <Text
          className={`text-sm leading-6 font-JakartaMedium ${
            isCurrentUser ? "text-white" : "text-[#2F2F42]"
          }`}
        >
          {message.text}
        </Text>
      </View>

      <Text className="mt-2 text-xs text-[#8A8AA6] font-JakartaRegular">
        {formatRelativeLabel(message.createdAtMs)}
      </Text>
    </View>
  );
};

const Chat = () => {
  const { user, isLoaded } = useUser();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isPreparingChat, setIsPreparingChat] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messageListRef = useRef<FlatList<ChatMessage> | null>(null);

  const userId = user?.id ?? null;
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;
  const userName = getDisplayName(user?.fullName, user?.username, userEmail);
  const userAvatar = user?.imageUrl ?? null;
  const trimmedDraft = draft.trim();
  const selectedRoom =
    rooms.find((room) => room.id === selectedRoomId) ?? rooms[0] ?? null;

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!userId) {
      setRooms([]);
      setMessages([]);
      setSelectedRoomId(null);
      setIsPreparingChat(false);
      return;
    }

    let isMounted = true;
    let unsubscribeRooms = () => undefined;

    const prepareChat = async () => {
      try {
        setChatError(null);
        setIsPreparingChat(true);

        await syncChatUserProfile({
          id: userId,
          name: userName,
          email: userEmail,
          avatar: userAvatar,
        });

        const rideResponse = await fetchAPI(`/(api)/(ride)/${userId}`);
        const bookedRides = Array.isArray(rideResponse?.data)
          ? (rideResponse.data as Ride[])
          : [];

        await Promise.all(
          bookedRides.map((ride) =>
            createRideChatRoom({
              rideId: ride.ride_id,
              rider: {
                id: userId,
                name: userName,
                email: userEmail,
                avatar: userAvatar,
              },
              driverId: ride.driver_id,
              driverName: ride.driver
                ? `${ride.driver.first_name} ${ride.driver.last_name}`
                : "your driver",
              originAddress: ride.origin_address,
              destinationAddress: ride.destination_address,
              createdAtMs: ride.created_at
                ? new Date(ride.created_at).getTime()
                : Date.now(),
            }),
          ),
        );

        if (!isMounted) {
          return;
        }

        unsubscribeRooms = subscribeToRideChatRooms(
          userId,
          (nextRooms) => {
            if (!isMounted) {
              return;
            }

            setRooms(nextRooms);
            setSelectedRoomId((currentRoomId) => {
              if (
                currentRoomId &&
                nextRooms.some((room) => room.id === currentRoomId)
              ) {
                return currentRoomId;
              }

              return nextRooms[0]?.id ?? null;
            });
            setIsPreparingChat(false);
          },
          (error) => {
            if (!isMounted) {
              return;
            }

            setChatError(
              getErrorMessage(
                error,
                "Unable to load ride chats. Check your Firebase connection.",
              ),
            );
            setIsPreparingChat(false);
          },
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setChatError(
          getErrorMessage(
            error,
            "Unable to set up ride chat right now. Check Firebase env values and Firestore rules.",
          ),
        );
        setIsPreparingChat(false);
      }
    };

    void prepareChat();

    return () => {
      isMounted = false;
      unsubscribeRooms();
    };
  }, [isLoaded, userAvatar, userEmail, userId, userName]);

  useEffect(() => {
    if (!selectedRoomId) {
      setMessages([]);
      setIsMessagesLoading(false);
      return;
    }

    let isMounted = true;
    setIsMessagesLoading(true);

    const unsubscribeMessages = subscribeToRoomMessages(
      selectedRoomId,
      (nextMessages) => {
        if (!isMounted) {
          return;
        }

        setMessages(nextMessages);
        setIsMessagesLoading(false);
      },
      (error) => {
        if (!isMounted) {
          return;
        }

        setChatError(
          getErrorMessage(
            error,
            "Unable to load messages for this room right now.",
          ),
        );
        setIsMessagesLoading(false);
      },
    );

    return () => {
      isMounted = false;
      unsubscribeMessages();
    };
  }, [selectedRoomId]);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      messageListRef.current?.scrollToEnd({ animated: true });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [messages.length, selectedRoomId]);

  const handleSendMessage = async () => {
    if (!selectedRoom?.id || !userId || !trimmedDraft || isSending) {
      return;
    }

    try {
      setIsSending(true);

      await sendChatMessage({
        roomId: selectedRoom.id,
        text: trimmedDraft,
        sender: {
          id: userId,
          name: userName,
          email: userEmail,
          avatar: userAvatar,
        },
      });

      setDraft("");
    } catch (error) {
      Alert.alert(
        "Message failed",
        getErrorMessage(
          error,
          "We couldn't send your message. Please try again in a moment.",
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFFFFF]" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 px-5 pb-2 pt-3">
          <View className="mb-5 flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-3xl text-[#2F2F42] font-JakartaBold">
                MoveO chat
              </Text>
              <Text className="mt-2 text-sm leading-6 text-[#46466B] font-JakartaRegular">
                Chat opens only after a ride is booked, so every thread stays
                tied to a real trip.
              </Text>
            </View>

            <View className="rounded-2xl bg-[#D6D6E0] px-4 py-3">
              <Text className="text-xs uppercase tracking-[1px] text-[#747490] font-JakartaMedium">
                CHATS
              </Text>
              <Text className="mt-1 text-lg text-[#2F2F42] font-JakartaBold">
                {isPreparingChat ? "..." : rooms.length}
              </Text>
            </View>
          </View>

          <View className="mb-5 rounded-[28px] bg-[#5D5D7D] px-5 py-5">
            <View className="flex-row items-center">
              <AvatarBadge
                name={userName}
                imageUrl={userAvatar}
                backgroundColor="#D6D6E0"
              />

              <View className="ml-3 flex-1">
                <Text className="text-sm text-[#D6D6E0] font-JakartaMedium">
                  Signed in as
                </Text>
                <Text className="mt-1 text-xl text-white font-JakartaBold">
                  {userName}
                </Text>
              </View>
            </View>

            <View className="mt-5 rounded-[22px] bg-[#46466B] px-4 py-4">
              <Text className="text-xs uppercase tracking-[1px] text-[#D6D6E0] font-JakartaMedium">
                Active trip
              </Text>
              <Text className="mt-2 text-lg text-white font-JakartaBold">
                {selectedRoom?.title ?? "No booked rides yet"}
              </Text>
              <Text className="mt-2 text-sm leading-6 text-[#E5E7F0] font-JakartaRegular">
                {selectedRoom?.description ??
                  "Book a ride and a dedicated chat will appear here automatically."}
              </Text>
            </View>
          </View>

          <Text className="mb-3 text-lg text-[#2F2F42] font-JakartaBold">
            Ride chats
          </Text>

          {rooms.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 8 }}
            >
              {rooms.map((room) => (
                <RoomChip
                  key={room.id}
                  room={room}
                  selected={room.id === selectedRoom?.id}
                  onPress={() => setSelectedRoomId(room.id)}
                />
              ))}
            </ScrollView>
          ) : (
            <View className="rounded-[24px] bg-[#F3F3F7] px-4 py-4">
              <Text className="text-sm leading-6 text-[#46466B] font-JakartaRegular">
                No ride chats yet. Once you confirm a booking, MoveO will create
                a trip-specific conversation for you automatically.
              </Text>
            </View>
          )}

          <View className="mb-4 mt-5 flex-1 rounded-[30px] bg-[#F3F3F7] p-4">
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-xl text-[#2F2F42] font-JakartaBold">
                  {selectedRoom?.title ?? "Loading room"}
                </Text>
                <Text className="mt-1 text-sm text-[#46466B] font-JakartaRegular">
                  {selectedRoom?.description ??
                    "Choose a booked ride to view its messages."}
                </Text>
              </View>

              <View className="h-12 w-12 items-center justify-center rounded-full bg-[#D6D6E0]">
                <Ionicons name="flash-outline" size={22} color="#5D5D7D" />
              </View>
            </View>

            {chatError ? (
              <View className="flex-1 items-center justify-center rounded-[24px] bg-white px-6">
                <Ionicons
                  name="cloud-offline-outline"
                  size={26}
                  color="#5D5D7D"
                />
                <Text className="mt-4 text-center text-lg text-[#2F2F42] font-JakartaBold">
                  Chat connection issue
                </Text>
                <Text className="mt-2 text-center text-sm leading-6 text-[#46466B] font-JakartaRegular">
                  {chatError}
                </Text>
              </View>
            ) : isPreparingChat || isMessagesLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="small" color="#5D5D7D" />
                <Text className="mt-3 text-sm text-[#46466B] font-JakartaMedium">
                  Loading real-time messages...
                </Text>
              </View>
            ) : messages.length === 0 ? (
              <View className="flex-1 items-center justify-center rounded-[24px] bg-white px-6">
                <Ionicons name="chatbubble-outline" size={26} color="#5D5D7D" />
                <Text className="mt-4 text-center text-lg text-[#2F2F42] font-JakartaBold">
                  {selectedRoom ? "No messages yet" : "No ride chat available"}
                </Text>
                <Text className="mt-2 text-center text-sm leading-6 text-[#46466B] font-JakartaRegular">
                  {selectedRoom
                    ? "Send the first message for this trip and it will stay attached to your booking."
                    : "Confirm a ride first and your trip chat will appear here automatically."}
                </Text>
              </View>
            ) : (
              <FlatList
                ref={messageListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <MessageBubble
                    message={item}
                    isCurrentUser={item.senderId === userId}
                  />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 6 }}
              />
            )}
          </View>

          <View className="mb-[108px] rounded-[28px] border border-[#E4E4ED] bg-white px-4 pb-4 pt-4">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={
                selectedRoom
                  ? "Write a message about this ride..."
                  : "Book a ride to unlock chat..."
              }
              placeholderTextColor="#8A8AA6"
              multiline
              maxLength={400}
              textAlignVertical="top"
              className="min-h-[88px] text-sm leading-6 text-[#2F2F42] font-JakartaMedium"
              editable={Boolean(selectedRoom)}
            />

            <View className="mt-4 flex-row items-center justify-between">
              <Text className="text-xs text-[#747490] font-JakartaMedium">
                {trimmedDraft
                  ? `${trimmedDraft.length}/400 characters`
                  : selectedRoom
                    ? "This chat belongs to your booked ride"
                    : "Ride chat is unlocked after booking"}
              </Text>

              <TouchableOpacity
                activeOpacity={0.9}
                className={`rounded-full px-5 py-3 ${
                  !trimmedDraft || isSending ? "bg-[#CFCFDC]" : "bg-[#5D5D7D]"
                }`}
                disabled={!trimmedDraft || isSending || !selectedRoom}
                onPress={() => {
                  void handleSendMessage();
                }}
              >
                <Text className="text-sm text-white font-JakartaBold">
                  {isSending ? "Sending..." : "Send"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Chat;
