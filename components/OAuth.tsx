import { useSignInWithGoogle } from "@clerk/expo/google";
import { useSSO } from "@clerk/expo";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  TurboModuleRegistry,
  View,
} from "react-native";

import { icons } from "@/constants";
import { syncOAuthUser } from "@/lib/auth";

const getMissingGoogleOAuthEnv = () => {
  const missing = [];

  if (!process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID) {
    missing.push("EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID");
  }

  if (
    Platform.OS === "ios" &&
    !process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID
  ) {
    missing.push("EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID");
  }

  return missing;
};

const hasNativeGoogleModule = () => {
  return Boolean(TurboModuleRegistry.get("ClerkGoogleSignIn"));
};

const OAuth = () => {
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const { startSSOFlow } = useSSO();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const finalizeOAuth = async (result: {
    createdSessionId: string | null;
    setActive?: ((params: { session: string }) => Promise<void>) | undefined;
    signUp?: {
      createdUserId?: string | null;
      emailAddress?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  }) => {
    if (result.createdSessionId && result.setActive) {
      await result.setActive({ session: result.createdSessionId });
      await syncOAuthUser(result.signUp);
      router.replace("/(root)/(tabs)/home");
      return true;
    }

    return false;
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;

    try {
      setIsGoogleLoading(true);

      const missingGoogleEnv = getMissingGoogleOAuthEnv();
      const canUseNativeGoogle =
        missingGoogleEnv.length === 0 && hasNativeGoogleModule();

      if (!canUseNativeGoogle) {
        const browserGoogleResult = await startSSOFlow({
          strategy: "oauth_google",
        });

        if (await finalizeOAuth(browserGoogleResult)) {
          return;
        }

        const missingEnvMessage =
          missingGoogleEnv.length > 0
            ? `Native Google sign-in needs these env vars:\n\n${missingGoogleEnv.join("\n")}\n\n`
            : "Native Google sign-in is not available in this build.\n\n";

        Alert.alert(
          "Google Sign-In setup required",
          `${missingEnvMessage}A browser-based Clerk fallback was attempted instead.`,
        );
        return;
      }

      const result = await startGoogleAuthenticationFlow();

      if (await finalizeOAuth(result)) {
        return;
      }

      Alert.alert(
        "Google sign-in failed",
        "Unable to complete authentication. Please try again.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      const shouldFallbackToBrowser =
        message.includes("native module is not available") ||
        message.includes("credentials not found");

      if (shouldFallbackToBrowser) {
        try {
          const browserResult = await startSSOFlow({
            strategy: "oauth_google",
          });

          if (await finalizeOAuth(browserResult)) {
            return;
          }
        } catch (fallbackError) {
          const fallbackMessage =
            fallbackError instanceof Error
              ? fallbackError.message
              : "Something went wrong.";

          Alert.alert("Google sign-in failed", fallbackMessage);
          return;
        }
      }

      Alert.alert("Google sign-in failed", message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View className="w-full mt-6">
      <View className="flex flex-row items-center mb-6">
        <View className="flex-1 h-[1px] bg-[#E5E5E5]" />
        <Text className="mx-3 text-[#8B8BA2] font-JakartaRegular">or</Text>
        <View className="flex-1 h-[1px] bg-[#E5E5E5]" />
      </View>

      <TouchableOpacity
        onPress={handleGoogleSignIn}
        disabled={isGoogleLoading}
        className="flex flex-row items-center justify-center w-full border border-brand-300 rounded-2xl py-4 bg-white"
      >
        <Image
          source={icons.google}
          className="w-5 h-5 mr-3"
          resizeMode="contain"
        />
        <Text className="text-base text-black font-JakartaSemiBold">
          {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default OAuth;
