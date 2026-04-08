import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PendingPhoneVerification = {
  id: string;
  phoneNumber: string;
};

type VerifiablePhoneResource = {
  id: string;
  phoneNumber: string;
  prepareVerification: (params: { strategy: "phone_code" }) => Promise<unknown>;
  attemptVerification: (params: {
    code: string;
  }) => Promise<{ verification: { status: string } }>;
};

const formatProfileDate = (date?: Date | null) => {
  if (!date) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const normalizePhoneNumber = (value: string) => value.replace(/\s+/g, "");

const isValidPhoneNumber = (value: string) => /^\+[1-9]\d{7,14}$/.test(value);

const getErrorMessage = (error: unknown, fallback: string) => {
  const clerkErrors =
    typeof error === "object" && error !== null && "errors" in error
      ? (error as { errors?: { longMessage?: string }[] }).errors
      : undefined;

  if (clerkErrors?.[0]?.longMessage) {
    return clerkErrors[0].longMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export default function Profile() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [usernameDraft, setUsernameDraft] = useState(user?.username ?? "");
  const [phoneDraft, setPhoneDraft] = useState(
    user?.primaryPhoneNumber?.phoneNumber ?? "",
  );
  const [avatarDraft, setAvatarDraft] = useState(user?.imageUrl ?? "");
  const [phoneVerificationCode, setPhoneVerificationCode] = useState("");
  const [pendingPhoneVerification, setPendingPhoneVerification] =
    useState<PendingPhoneVerification | null>(null);
  const pendingPhoneVerificationRef = useRef<VerifiablePhoneResource | null>(
    null,
  );
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

  useEffect(() => {
    setFullName(user?.fullName ?? "");
    setUsernameDraft(user?.username ?? "");
    setPhoneDraft(user?.primaryPhoneNumber?.phoneNumber ?? "");
    setAvatarDraft(user?.imageUrl ?? "");
  }, [
    user?.fullName,
    user?.imageUrl,
    user?.primaryPhoneNumber?.phoneNumber,
    user?.username,
  ]);

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

  const handleCancelEdit = () => {
    setFullName(user?.fullName ?? "");
    setUsernameDraft(user?.username ?? "");
    setPhoneDraft(user?.primaryPhoneNumber?.phoneNumber ?? "");
    setAvatarDraft(user?.imageUrl ?? "");
    setIsEditing(false);
  };

  const handlePickProfileImage = async () => {
    try {
      setIsPickingImage(true);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Allow photo library access to choose a profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setAvatarDraft(result.assets[0].uri);
    } catch (error) {
      console.error("Unable to pick profile image:", error);
      Alert.alert(
        "Photo selection failed",
        getErrorMessage(error, "Unable to choose a profile picture right now."),
      );
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      Alert.alert("Name required", "Please enter your full name.");
      return;
    }

    const normalizedPhoneDraft = normalizePhoneNumber(phoneDraft.trim());
    const normalizedCurrentPhone = normalizePhoneNumber(
      user?.primaryPhoneNumber?.phoneNumber ?? "",
    );
    const isPhoneChanged = normalizedPhoneDraft !== normalizedCurrentPhone;

    if (isPhoneChanged && !normalizedPhoneDraft) {
      Alert.alert(
        "Phone number required",
        "Enter a mobile number in international format, like +919876543210.",
      );
      return;
    }

    if (isPhoneChanged && !isValidPhoneNumber(normalizedPhoneDraft)) {
      Alert.alert(
        "Invalid phone number",
        "Use international format with a country code, like +919876543210.",
      );
      return;
    }

    try {
      setIsSaving(true);

      const parts = trimmedFullName.split(/\s+/);
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || undefined;
      const trimmedUsername = usernameDraft.trim();
      const hasNewAvatar =
        Boolean(avatarDraft) && avatarDraft !== user.imageUrl;

      await user.update({
        firstName,
        lastName,
        username: trimmedUsername || undefined,
      });

      if (hasNewAvatar) {
        await user.setProfileImage({ file: avatarDraft });
      }

      if (
        isPhoneChanged &&
        pendingPhoneVerification?.phoneNumber !== normalizedPhoneDraft
      ) {
        const phoneNumber = (await user.createPhoneNumber({
          phoneNumber: normalizedPhoneDraft,
        })) as unknown as VerifiablePhoneResource;

        await phoneNumber.prepareVerification({ strategy: "phone_code" });
        pendingPhoneVerificationRef.current = phoneNumber;
        setPendingPhoneVerification({
          id: phoneNumber.id,
          phoneNumber: phoneNumber.phoneNumber,
        });
        setPhoneVerificationCode("");
      }

      await user.reload();
      setIsEditing(false);

      if (isPhoneChanged) {
        Alert.alert(
          "Verify your phone",
          `We sent a code to ${normalizedPhoneDraft}. Enter it below to finish linking your mobile number.`,
        );
        return;
      }

      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      console.error("Unable to update profile:", error);
      Alert.alert(
        "Update failed",
        getErrorMessage(
          error,
          "Unable to update your profile right now. Please try again.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyPhoneNumber = async () => {
    if (!user || !pendingPhoneVerification) return;

    const trimmedCode = phoneVerificationCode.trim();
    if (!trimmedCode) {
      Alert.alert("Code required", "Enter the verification code we sent you.");
      return;
    }

    const phoneResource =
      pendingPhoneVerificationRef.current?.id === pendingPhoneVerification.id
        ? pendingPhoneVerificationRef.current
        : null;

    if (!phoneResource) {
      Alert.alert(
        "Verification expired",
        "Please save your phone number again to request a new code.",
      );
      return;
    }

    try {
      setIsVerifyingPhone(true);

      const result = await phoneResource.attemptVerification({
        code: trimmedCode,
      });

      if (result.verification.status !== "verified") {
        Alert.alert(
          "Verification pending",
          "That code was not accepted. Please check it and try again.",
        );
        return;
      }

      await user.update({
        primaryPhoneNumberId: pendingPhoneVerification.id,
      });
      await user.reload();

      pendingPhoneVerificationRef.current = null;
      setPendingPhoneVerification(null);
      setPhoneVerificationCode("");
      setPhoneDraft(pendingPhoneVerification.phoneNumber);

      Alert.alert("Phone added", "Your mobile number has been verified.");
    } catch (error) {
      console.error("Unable to verify phone number:", error);
      Alert.alert(
        "Verification failed",
        getErrorMessage(
          error,
          "Unable to verify your mobile number right now. Please try again.",
        ),
      );
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleResendPhoneCode = async () => {
    const phoneResource =
      pendingPhoneVerificationRef.current?.id === pendingPhoneVerification?.id
        ? pendingPhoneVerificationRef.current
        : null;

    if (!phoneResource || !pendingPhoneVerification) {
      Alert.alert(
        "No pending verification",
        "Save your phone number again to request a fresh code.",
      );
      return;
    }

    try {
      setIsVerifyingPhone(true);
      await phoneResource.prepareVerification({ strategy: "phone_code" });
      Alert.alert(
        "Code sent",
        `A fresh verification code was sent to ${pendingPhoneVerification.phoneNumber}.`,
      );
    } catch (error) {
      console.error("Unable to resend verification code:", error);
      Alert.alert(
        "Unable to resend code",
        getErrorMessage(
          error,
          "We couldn't send another code right now. Please try again.",
        ),
      );
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white mb-10">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-3xl font-JakartaBold text-black">Profile</Text>

          {isEditing ? (
            <TouchableOpacity
              className="rounded-full bg-[#E7E7EF] px-4 py-2"
              disabled={isSaving}
              onPress={handleCancelEdit}
            >
              <Text className="font-JakartaSemiBold text-[#46466B]">
                Cancel
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="rounded-full bg-[#747490] px-4 py-2"
              onPress={() => setIsEditing(true)}
            >
              <Text className="font-JakartaSemiBold text-white">Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="items-center rounded-3xl bg-[#D6D6E0] p-5">
          <View className="mb-4 items-center">
            <Image
              source={{
                uri: avatarDraft || avatar || "https://via.placeholder.com/100",
              }}
              className="h-24 w-24 rounded-full"
            />

            {isEditing && (
              <TouchableOpacity
                className="mt-3 flex-row items-center rounded-full bg-[#747490] px-4 py-2"
                disabled={isPickingImage || isSaving}
                onPress={handlePickProfileImage}
              >
                <Ionicons name="image-outline" size={16} color="#FFFFFF" />
                <Text className="ml-2 font-JakartaSemiBold text-white">
                  {isPickingImage ? "Opening..." : "Change Photo"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-center text-[#46466B]"
              placeholder="Enter your full name"
            />
          ) : (
            <Text className="text-2xl font-JakartaBold text-[#46466B]">
              {name}
            </Text>
          )}
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
              Mobile number
            </Text>
            {isEditing ? (
              <TextInput
                value={phoneDraft}
                onChangeText={setPhoneDraft}
                keyboardType="phone-pad"
                autoCorrect={false}
                className="mt-2 rounded-2xl bg-white px-4 py-3 text-[#46466B]"
                placeholder="+919876543210"
                placeholderTextColor="#7B7B95"
              />
            ) : (
              <Text className="mt-1 text-base font-JakartaSemiBold text-[#46466B]">
                {phone}
              </Text>
            )}

            {isEditing && (
              <Text className="mt-2 text-sm font-JakartaRegular text-[#5D5D7D]">
                Use international format with country code.
              </Text>
            )}
          </View>

          <View className="border-b border-[#A2A2B5] py-4">
            <Text className="text-xs font-JakartaMedium uppercase tracking-[1px] text-[#5D5D7D]">
              Username
            </Text>
            {isEditing ? (
              <TextInput
                value={usernameDraft}
                onChangeText={setUsernameDraft}
                autoCapitalize="none"
                autoCorrect={false}
                className="mt-2 rounded-2xl bg-white px-4 py-3 text-[#46466B]"
                placeholder="Enter a username"
                placeholderTextColor="#7B7B95"
              />
            ) : (
              <Text className="mt-1 text-base font-JakartaSemiBold text-[#46466B]">
                {username}
              </Text>
            )}
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

        {pendingPhoneVerification && (
          <View className="mt-6 rounded-3xl bg-[#D6D6E0] p-4">
            <Text className="text-lg font-JakartaSemiBold text-[#46466B]">
              Verify mobile number
            </Text>
            <Text className="mt-2 text-sm leading-6 font-JakartaRegular text-[#5D5D7D]">
              Enter the code sent to {pendingPhoneVerification.phoneNumber} to
              finish linking your phone.
            </Text>

            <TextInput
              value={phoneVerificationCode}
              onChangeText={setPhoneVerificationCode}
              keyboardType="number-pad"
              className="mt-4 rounded-2xl bg-white px-4 py-3 text-[#46466B]"
              placeholder="Enter verification code"
              placeholderTextColor="#7B7B95"
            />

            <TouchableOpacity
              className="mt-4 items-center rounded-full bg-[#46466B] py-4"
              disabled={isVerifyingPhone}
              onPress={handleVerifyPhoneNumber}
            >
              <Text className="text-base font-JakartaBold text-white">
                {isVerifyingPhone ? "Verifying..." : "Verify Number"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-3 items-center rounded-full border border-[#747490] py-4"
              disabled={isVerifyingPhone}
              onPress={handleResendPhoneCode}
            >
              <Text className="text-base font-JakartaSemiBold text-[#46466B]">
                Resend Code
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isEditing && (
          <TouchableOpacity
            className="mt-8 items-center rounded-full bg-[#46466B] py-4"
            disabled={isSaving || isPickingImage}
            onPress={handleSaveProfile}
          >
            <Text className="text-base font-JakartaBold text-white">
              {isSaving ? "Saving..." : "Save Profile"}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="mt-4 items-center rounded-full bg-[#747490] py-4"
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
