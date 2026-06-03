import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
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

// ─── Types ────────────────────────────────────────────────────────────────────

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

type MsgItem = { type: "msg"; msg: Message; isFirst: boolean; isLast: boolean };
type SepItem = { type: "sep"; label: string };
type TypingItem = { type: "typing" };
type ListItem = MsgItem | SepItem | TypingItem;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#5D5D7D", "#6C63B5", "#4ECDC4", "#E8876A", "#5B9BD5", "#7EB87E"];

const getAvatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const getDriverName = (ride: Ride) =>
  `${ride.driver?.first_name ?? "Driver"} ${ride.driver?.last_name ?? ""}`.trim();

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

const getTimestamp = (createdAt: Message["createdAt"]): number => {
  if (!createdAt?.toMillis) return 0;
  return createdAt.toMillis() ?? 0;
};

const formatMessageTime = (createdAt: Message["createdAt"]) => {
  const ms = getTimestamp(createdAt);
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getDateLabel = (createdAt: Message["createdAt"]): string => {
  const ms = getTimestamp(createdAt);
  if (!ms) return "";
  const date = new Date(ms);
  const now = new Date();
  const toDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = toDay(now) - toDay(date);
  if (diff === 0) return "Today";
  if (diff === 86400000) return "Yesterday";
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

const formatRideDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const buildListItems = (messages: Message[], showTyping: boolean): ListItem[] => {
  const items: ListItem[] = [];
  let lastLabel = "";

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const label = getDateLabel(msg.createdAt);

    if (label && label !== lastLabel) {
      items.push({ type: "sep", label });
      lastLabel = label;
    }

    const prevSame = i > 0 && messages[i - 1].senderId === msg.senderId;
    const nextSame = i < messages.length - 1 && messages[i + 1].senderId === msg.senderId;
    items.push({ type: "msg", msg, isFirst: !prevSame, isLast: !nextSame });
  }

  if (showTyping) items.push({ type: "typing" });
  return items;
};

// ─── Typing dots ──────────────────────────────────────────────────────────────

const TypingDots = ({ color }: { color: string }) => {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (a: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(a, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0, duration: 320, useNativeDriver: true }),
          Animated.delay(Math.max(0, 1280 - delay - 640)),
        ])
      );

    const anims = [pulse(a1, 0), pulse(a2, 210), pulse(a3, 420)];
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [a1, a2, a3]);

  const dot = (a: Animated.Value) => ({
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#9191AA",
    marginRight: 5,
    opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  } as const);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 13,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: "#E8E8F0",
        alignSelf: "flex-start",
        maxWidth: "60%",
      }}
    >
      <Animated.View style={dot(a1)} />
      <Animated.View style={dot(a2)} />
      <Animated.View style={[dot(a3), { marginRight: 0 }]} />
    </View>
  );
};

// ─── Date separator ───────────────────────────────────────────────────────────

const DateSeparator = ({ label }: { label: string }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 16,
      paddingHorizontal: 20,
    }}
  >
    <View style={{ flex: 1, height: 1, backgroundColor: "#EBEBF2" }} />
    <Text
      style={{
        marginHorizontal: 12,
        fontSize: 11,
        color: "#A2A2B5",
        fontFamily: "Jakarta-Medium",
      }}
    >
      {label}
    </Text>
    <View style={{ flex: 1, height: 1, backgroundColor: "#EBEBF2" }} />
  </View>
);

// ─── Message bubble ───────────────────────────────────────────────────────────

const AVATAR_SIZE = 28;
const AVATAR_GAP = 8;

const Bubble = ({
  message,
  isMe,
  isFirst,
  isLast,
  driverInitials,
  driverColor,
}: {
  message: Message;
  isMe: boolean;
  isFirst: boolean;
  isLast: boolean;
  driverInitials: string;
  driverColor: string;
}) => {
  const radius = {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: !isMe && isLast ? 4 : 18,
    borderBottomRightRadius: isMe && isLast ? 4 : 18,
  };

  return (
    <View
      style={{
        marginBottom: isLast ? 10 : 2,
        marginTop: isFirst ? 2 : 0,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: isMe ? "flex-end" : "flex-start",
          paddingHorizontal: 14,
        }}
      >
        {/* Driver avatar column */}
        {!isMe && (
          <View
            style={{
              width: AVATAR_SIZE,
              marginRight: AVATAR_GAP,
              alignItems: "center",
              justifyContent: "flex-end",
              paddingBottom: 0,
            }}
          >
            {isLast ? (
              <View
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderRadius: AVATAR_SIZE / 2,
                  backgroundColor: driverColor,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontFamily: "Jakarta-Bold",
                  }}
                >
                  {driverInitials}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Bubble */}
        <View
          style={{
            ...radius,
            maxWidth: "72%",
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: isMe ? "#5D5D7D" : "#FFFFFF",
            borderWidth: isMe ? 0 : 1,
            borderColor: "#E8E8F0",
          }}
        >
          <Text
            style={{
              color: isMe ? "#FFFFFF" : "#2F2F42",
              fontSize: 14,
              lineHeight: 21,
              fontFamily: "Jakarta-Medium",
            }}
          >
            {message.text}
          </Text>
        </View>
      </View>

      {/* Timestamp — only on last bubble in group */}
      {isLast && (
        <Text
          style={{
            marginTop: 4,
            fontSize: 11,
            color: "#B0B0C3",
            fontFamily: "Jakarta-Regular",
            textAlign: isMe ? "right" : "left",
            paddingHorizontal: isMe
              ? 14
              : 14 + AVATAR_SIZE + AVATAR_GAP,
          }}
        >
          {formatMessageTime(message.createdAt)}
        </Text>
      )}
    </View>
  );
};

// ─── Conversation list row ────────────────────────────────────────────────────

const ConversationRow = ({
  ride,
  onPress,
}: {
  ride: Ride;
  onPress: () => void;
}) => {
  const name = getDriverName(ride);
  const color = getAvatarColor(name);

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* Avatar with status dot */}
      <View>
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: color,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 16, fontFamily: "Jakarta-Bold" }}>
            {getInitials(name)}
          </Text>
        </View>
        <View
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: "#34C759",
            borderWidth: 2,
            borderColor: "#FFFFFF",
          }}
        />
      </View>

      {/* Info */}
      <View style={{ marginLeft: 12, flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 15, color: "#2F2F42", fontFamily: "Jakarta-Bold" }}>
            {name}
          </Text>
          <Text style={{ fontSize: 12, color: "#B0B0C3", fontFamily: "Jakarta-Regular" }}>
            {formatRideDate(ride.created_at)}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
          <Ionicons name="location-outline" size={12} color="#A2A2B5" />
          <Text
            style={{
              marginLeft: 3,
              fontSize: 13,
              color: "#8484A0",
              fontFamily: "Jakarta-Regular",
              flex: 1,
            }}
            numberOfLines={1}
          >
            {getShortAddress(ride.origin_address)} → {getShortAddress(ride.destination_address)}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#C8C8D8" style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );
};

// ─── Chat view ────────────────────────────────────────────────────────────────

const TAB_BAR_HEIGHT = 78 + 20;

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
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
      listRef.current?.scrollToEnd({ animated: true });
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const listRef = useRef<FlatList<ListItem>>(null);
  const inputRef = useRef<TextInput>(null);

  const name = getDriverName(ride);
  const driverColor = getAvatarColor(name);
  const driverInitials = getInitials(name);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToMessages(String(ride.ride_id), (next) => {
      setMessages(next as Message[]);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [ride.ride_id]);

  const listItems = useMemo(
    () => buildListItems(messages, isSending),
    [messages, isSending]
  );

  useEffect(() => {
    if (!listItems.length) return;
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [listItems.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setDraft("");
    inputRef.current?.clear();
    try {
      const rideId = String(ride.ride_id);
      await sendMessage(rideId, userId, text);
      try {
        await fetchAPI("/(api)/(chat)/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rideId }),
        });
      } catch (e) {
        console.warn("Driver reply failed:", e);
      }
    } catch {
      setDraft(text);
    } finally {
      setIsSending(false);
    }
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "sep") return <DateSeparator label={item.label} />;
    if (item.type === "typing") {
      return (
        <View style={{ paddingHorizontal: 14, paddingLeft: 14 + AVATAR_SIZE + AVATAR_GAP, marginBottom: 10 }}>
          <TypingDots color={driverColor} />
        </View>
      );
    }
    return (
      <Bubble
        message={item.msg}
        isMe={item.msg.senderId === userId}
        isFirst={item.isFirst}
        isLast={item.isLast}
        driverInitials={driverInitials}
        driverColor={driverColor}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingBottom: 12,
          paddingTop: 4,
          borderBottomWidth: 1,
          borderBottomColor: "#F0F0F7",
          backgroundColor: "#FFFFFF",
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={{
            marginRight: 12,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#F3F3F9",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={18} color="#2F2F42" />
        </TouchableOpacity>

        <View>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: driverColor,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#FFF", fontSize: 13, fontFamily: "Jakarta-Bold" }}>
              {driverInitials}
            </Text>
          </View>
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 11,
              height: 11,
              borderRadius: 6,
              backgroundColor: "#34C759",
              borderWidth: 2,
              borderColor: "#FFFFFF",
            }}
          />
        </View>

        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ fontSize: 15, color: "#2F2F42", fontFamily: "Jakarta-Bold" }}>
            {name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 1 }}>
            <Ionicons name="navigate-outline" size={11} color="#A2A2B5" />
            <Text
              style={{
                marginLeft: 3,
                fontSize: 12,
                color: "#9090A8",
                fontFamily: "Jakarta-Regular",
              }}
              numberOfLines={1}
            >
              {getShortAddress(ride.destination_address)}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F7FC" }}>
          <ActivityIndicator size="small" color="#5D5D7D" />
        </View>
      ) : messages.length === 0 && !isSending ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
            backgroundColor: "#F7F7FC",
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#EEEEF5",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="chatbubbles-outline" size={28} color="#A2A2B5" />
          </View>
          <Text style={{ fontSize: 16, color: "#2F2F42", fontFamily: "Jakarta-Bold", textAlign: "center" }}>
            No messages yet
          </Text>
          <Text
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "#8484A0",
              fontFamily: "Jakarta-Regular",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Say hi to coordinate with your driver.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={listItems}
          keyExtractor={(item, index) => {
            if (item.type === "sep") return `sep-${item.label}-${index}`;
            if (item.type === "typing") return "typing";
            return item.msg.id;
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
          style={{ backgroundColor: "#F7F7FC" }}
          renderItem={renderItem}
        />
      )}

      {/* Input bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          paddingHorizontal: 14,
          paddingTop: 10,
          paddingBottom: keyboardVisible ? 0 : inputBottomPad,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#EDEDF5",
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
            },
            android: { elevation: 6 },
          }),
        }}
      >
        <TextInput
          ref={inputRef}
          value={draft}
          onChangeText={setDraft}
          placeholder="Message your driver…"
          placeholderTextColor="#B0B0C8"
          multiline
          maxLength={400}
          style={{
            flex: 1,
            maxHeight: 110,
            borderRadius: 22,
            backgroundColor: "#F3F3F9",
            paddingHorizontal: 16,
            paddingTop: Platform.OS === "ios" ? 11 : 9,
            paddingBottom: Platform.OS === "ios" ? 11 : 9,
            fontSize: 14,
            color: "#2F2F42",
            fontFamily: "Jakarta-Medium",
            lineHeight: 20,
          }}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => { void handleSend(); }}
          disabled={!draft.trim() || isSending}
          style={{
            marginLeft: 10,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: draft.trim() && !isSending ? "#5D5D7D" : "#DDDDE8",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="send" size={17} color="#FFFFFF" />
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
      .then((res) => setRides(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setRides([]))
      .finally(() => setIsLoading(false));
  }, [isLoaded, isFocused, user?.id]);

  if (openRide && user?.id) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={["top"]}>
        <ChatView ride={openRide} userId={user.id} onBack={() => setOpenRide(null)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={["top"]}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 28, color: "#2F2F42", fontFamily: "Jakarta-Bold" }}>
          Messages
        </Text>
        <Text style={{ marginTop: 2, fontSize: 13, color: "#8484A0", fontFamily: "Jakarta-Regular" }}>
          Your ride chats
        </Text>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: "#F0F0F7" }} />

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="small" color="#5D5D7D" />
        </View>
      ) : rides.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "#F3F3F9",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={32} color="#A2A2B5" />
          </View>
          <Text style={{ fontSize: 18, color: "#2F2F42", fontFamily: "Jakarta-Bold", textAlign: "center" }}>
            No conversations yet
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#8484A0",
              fontFamily: "Jakarta-Regular",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Once you book a ride, a chat with your driver will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => String(item.ride_id)}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: "#F3F3F9", marginLeft: 82 }} />
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