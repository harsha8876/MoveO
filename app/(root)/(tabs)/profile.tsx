import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatProfileDate = (date?: Date | null) => {
  if (!date) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export default function Profile() {
  const { user } = useUser();
  const { signOut } = useAuth();

  const name = user?.fullName || "MoveO Rider";
  const email =
    user?.primaryEmailAddress?.emailAddress || "No email address provided";
  const avatar = user?.imageUrl;
  const phone =
    user?.primaryPhoneNumber?.phoneNumber || "No phone number added";
  const username = user?.username || "Username not set";
  const emailStatus =
    user?.primaryEmailAddress?.verification?.status === "verified"
      ? "Verified"
      : "Pending";
  const memberSince = formatProfileDate(user?.createdAt);
  const userId = user?.id || "Unavailable";

  const handleSignOut = () => {
    Alert.alert("Sign out", "Do you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white mb-10">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40}}>
        <Text className="mb-6 text-3xl font-JakartaBold text-black">
          Profile
        </Text>

        <View className="items-center rounded-3xl bg-[#D6D6E0] p-5">
          <Image
            source={{
              uri: avatar || "https://via.placeholder.com/100",
            }}
            className="mb-4 h-24 w-24 rounded-full"
          />
          <Text className="text-2xl font-JakartaBold text-[#46466B]">
            {name}
          </Text>
          <Text className="mt-1 text-base font-JakartaMedium text-[#5D5D7D]">
            {email}
          </Text>
        </View>

        <View className="mt-6 flex-row justify-between">
          <View className="mr-3 flex-1 rounded-3xl bg-[#D6D6E0] p-4">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-[#B9B9C7]">
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#5D5D7D"
              />
            </View>
            <Text className="mt-4 text-sm font-JakartaMedium text-[#46466B]">
              Email status
            </Text>
            <Text className="mt-1 text-xl font-JakartaBold text-[#2F2F42]">
              {emailStatus}
            </Text>
          </View>

          <View className="flex-1 rounded-3xl bg-[#D6D6E0] p-4">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-[#B9B9C7]">
              <Ionicons name="calendar-outline" size={20} color="#5D5D7D" />
            </View>
            <Text className="mt-4 text-sm font-JakartaMedium text-[#46466B]">
              Member since
            </Text>
            <Text className="mt-1 text-xl font-JakartaBold text-[#2F2F42]">
              {memberSince}
            </Text>
          </View>
        </View>

        <View className="mt-6 rounded-3xl bg-[#B9B9C7] p-4">
          <Text className="mb-3 text-lg font-JakartaSemiBold text-[#46466B]">
            Account details
          </Text>

          <View className="border-b border-[#A2A2B5] py-4">
            <Text className="text-xs font-JakartaMedium uppercase tracking-[1px] text-[#5D5D7D]">
              Phone number
            </Text>
            <Text className="mt-1 text-base font-JakartaSemiBold text-[#46466B]">
              {phone}
            </Text>
          </View>

          <View className="border-b border-[#A2A2B5] py-4">
            <Text className="text-xs font-JakartaMedium uppercase tracking-[1px] text-[#5D5D7D]">
              Username
            </Text>
            <Text className="mt-1 text-base font-JakartaSemiBold text-[#46466B]">
              {username}
            </Text>
          </View>

          <View className="border-b border-[#A2A2B5] py-4">
            <Text className="text-xs font-JakartaMedium uppercase tracking-[1px] text-[#5D5D7D]">
              User ID
            </Text>
            <Text className="mt-1 text-base font-JakartaSemiBold text-[#46466B]">
              {userId}
            </Text>
          </View>

          <TouchableOpacity
            className="py-4"
            onPress={() => router.push("/(root)/(tabs)/rides")}
          >
            <Text className="text-base font-JakartaSemiBold text-[#46466B]">
              Trip History
            </Text>
            <Text className="mt-1 text-sm font-JakartaRegular text-[#5D5D7D]">
              View your completed rides
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="mt-8 items-center rounded-full bg-[#747490] py-4"
          onPress={handleSignOut}
        >
          <Text className="text-base font-JakartaBold text-white">
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
