import { useSSO } from "@clerk/expo";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";

import { icons } from "@/constants";
import { syncOAuthUser } from "@/lib/auth";

const OAuth = () => {
  const { startSSOFlow } = useSSO();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;

    try {
      setIsGoogleLoading(true);

      const { createdSessionId, setActive, signUp } = await startSSOFlow({
        strategy: "oauth_google",
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        await syncOAuthUser(signUp);
        router.replace("/(root)/(tabs)/home");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
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
