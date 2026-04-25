import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { sendMessage, subscribeToMessages } from "@/lib/chat";
import { fetchAPI } from "@/lib/fetch";
import { getShortAddress } from "@/lib/utils";

type Ride = {
  ride_id: number;
  origin_address: string;
  destination_address: string;
  created_at: string;
  driver?: {
    driver_id?: number;
    first_name?: string;
    last_name?: string;
  };
};

type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt: { toMillis?: () => number } | null;
};

const getDriverName = (ride: Ride) =>
  `${ride.driver?.first_name ?? "Driver"} ${ride.driver?.last_name ?? ""}`.trim();

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

const formatMessageTime = (createdAt: Message["createdAt"]) => {
  if (!createdAt) return "";
  const ms =
    typeof createdAt.toMillis === "function" ? createdAt.toMillis() : 0;
  if (!ms) return "";
  const date = new Date(ms);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday
    ? date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

const formatRideDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// ─── Conversation list item ───────────────────────────────────────────────────

const ConversationRow = ({
  ride,
  onPress,
}: {
  ride: Ride;
  onPress: () => void;
}) => {
  const name = getDriverName(ride);
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center px-5 py-4"
    >
      {/* Avatar */}
      <View className="h-12 w-12 items-center justify-center rounded-full bg-[#5D5D7D]">
        <Text className="text-base text-white font-JakartaBold">
          {getInitials(name)}
        </Text>
      </View>

      {/* Info */}
      <View className="ml-3 flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-base text-[#2F2F42] font-JakartaBold">
            {name}
          </Text>
          <Text className="text-xs text-[#A2A2B5] font-JakartaRegular">
            {formatRideDate(ride.created_at)}
          </Text>
        </View>
        <Text
          className="mt-0.5 text-sm text-[#747490] font-JakartaRegular"
          numberOfLines={1}
        >
          {getShortAddress(ride.origin_address)} →{" "}
          {getShortAddress(ride.destination_address)}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={16}
        color="#A2A2B5"
        style={{ marginLeft: 8 }}
      />
    </TouchableOpacity>
  );
};

// ─── Message bubble ───────────────────────────────────────────────────────────

const Bubble = ({
  message,
  isMe,
}: {
  message: Message;
  isMe: boolean;
}) => (
  <View className={`mb-3 px-4 ${isMe ? "items-end" : "items-start"}`}>
    <View
      className={`rounded-[20px] px-4 py-3 ${isMe ? "bg-[#5D5D7D]" : "bg-white"}`}
      style={{
        maxWidth: "78%",
        borderWidth: isMe ? 0 : 1,
        borderColor: "#E4E4ED",
      }}
    >
      <Text
        className={`text-sm leading-[22px] font-JakartaMedium ${
          isMe ? "text-white" : "text-[#2F2F42]"
        }`}
      >
        {message.text}
      </Text>
    </View>
    <Text className="mt-1 text-xs text-[#A2A2B5] font-JakartaRegular">
      {formatMessageTime(message.createdAt)}
    </Text>
  </View>
);

// ─── Chat view ────────────────────────────────────────────────────────────────

const TAB_BAR_HEIGHT = 78 + 20; // height + marginBottom from _layout.tsx

const ChatView = ({
  ride,
  userId,
  onBack,
}: {
  ride: Ride;
  userId: string;
  onBack: () => void;
}) => {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const inputBottomPad = TAB_BAR_HEIGHT + bottomInset;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);
  const autoReplySent = useRef(false);
  const name = getDriverName(ride);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToMessages(
      String(ride.ride_id),
      (next) => {
        setMessages(next as Message[]);
        setIsLoading(false);
      },
    );
    return () => unsubscribe();
  }, [ride.ride_id]);

  useEffect(() => {
    if (!messages.length) return;
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setDraft("");
    try {
      const rideId = String(ride.ride_id);
      await sendMessage(rideId, userId, text);

      // Automated driver reply — only on first message
      if (!autoReplySent.current) {
        autoReplySent.current = true;
        const driverId = `driver-${ride.driver?.driver_id ?? ride.ride_id}`;
        setTimeout(async () => {
          try {
            await sendMessage(rideId, driverId, "on the way");
          } catch (e) {
            console.error("Driver auto-reply failed:", e);
          }
        }, 1500);
      }
    } catch {
      setDraft(text);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={TAB_BAR_HEIGHT}
    >
      {/* Chat header */}
      <View className="flex-row items-center border-b border-[#F0F0F5] px-4 pb-3 pt-1">
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-[#F3F3F7]"
        >
          <Ionicons name="arrow-back" size={18} color="#2F2F42" />
        </TouchableOpacity>

        <View className="h-10 w-10 items-center justify-center rounded-full bg-[#5D5D7D]">
          <Text className="text-sm text-white font-JakartaBold">
            {getInitials(name)}
          </Text>
        </View>

        <View className="ml-3 flex-1">
          <Text className="text-base text-[#2F2F42] font-JakartaBold">
            {name}
          </Text>
          <Text className="text-xs text-[#747490] font-JakartaRegular" numberOfLines={1}>
            {getShortAddress(ride.destination_address)}
          </Text>
        </View>
      </View>

      {/* Messages */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#5D5D7D" />
        </View>
      ) : messages.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-[#F3F3F7]">
            <Ionicons name="chatbubbles-outline" size={28} color="#A2A2B5" />
          </View>
          <Text className="mt-4 text-base text-[#2F2F42] font-JakartaBold">
            No messages yet
          </Text>
          <Text className="mt-1 text-center text-sm text-[#747490] font-JakartaRegular">
            Send a message to coordinate with your driver.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
          renderItem={({ item }) => (
            <Bubble message={item} isMe={item.senderId === userId} />
          )}
        />
      )}

      {/* Input bar */}
      <View
        className="flex-row items-end border-t border-[#F0F0F5] bg-white px-4 pt-3"
        style={{ paddingBottom: inputBottomPad }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message your driver..."
          placeholderTextColor="#A2A2B5"
          multiline
          maxLength={400}
          className="max-h-28 flex-1 rounded-[20px] bg-[#F3F3F7] px-4 py-3 text-sm text-[#2F2F42] font-JakartaMedium"
        />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            void handleSend();
          }}
          disabled={!draft.trim() || isSending}
          className="ml-3 h-11 w-11 items-center justify-center rounded-full"
          style={{
            backgroundColor: draft.trim() && !isSending ? "#5D5D7D" : "#D6D6E0",
          }}
        >
          <Ionicons name="send" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Root screen ──────────────────────────────────────────────────────────────

const Chat = () => {
  const { user, isLoaded } = useUser();
  const isFocused = useIsFocused();
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openRide, setOpenRide] = useState<Ride | null>(null);

  useEffect(() => {
    if (!isLoaded || !isFocused || !user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchAPI(`/(api)/(ride)/${user.id}`)
      .then((res) => {
        setRides(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => setRides([]))
      .finally(() => setIsLoading(false));
  }, [isLoaded, isFocused, user?.id]);

  // ── Chat open ────────────────────────────────────────────────────────────
  if (openRide && user?.id) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ChatView
          ride={openRide}
          userId={user.id}
          onBack={() => setOpenRide(null)}
        />
      </SafeAreaView>
    );
  }

  // ── Conversation list ────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-5 pb-4 pt-4">
        <Text className="text-3xl text-[#2F2F42] font-JakartaBold">
          Messages
        </Text>
        <Text className="mt-1 text-sm text-[#46466B] font-JakartaRegular">
          Your ride chats, one per booking.
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#5D5D7D" />
        </View>
      ) : rides.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-[#F3F3F7]">
            <Ionicons name="chatbubble-outline" size={32} color="#A2A2B5" />
          </View>
          <Text className="mt-5 text-xl text-[#2F2F42] font-JakartaBold">
            No conversations yet
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-[#747490] font-JakartaRegular">
            Once you book a ride, a chat with your driver will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => String(item.ride_id)}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View className="mx-5 h-px bg-[#F0F0F5]" />
          )}
          renderItem={({ item }) => (
            <ConversationRow ride={item} onPress={() => setOpenRide(item)} />
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default Chat;
