import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { icons } from "@/constants";

const OAuth = () => {
  const handleGoogleSignIn = () => {
    console.log("Google Sign In Pressed");
  };

  return (
    <View className="w-full mt-6">
      {/* Divider */}
      <View className="flex flex-row items-center mb-6">
        <View className="flex-1 h-[1px] bg-[#E5E5E5]" />
        <Text className="mx-3 text-[#8B8BA2] font-JakartaRegular">or</Text>
        <View className="flex-1 h-[1px] bg-[#E5E5E5]" />
      </View>

      {/* Google Button */}
      <TouchableOpacity
        onPress={handleGoogleSignIn}
        className="flex flex-row items-center justify-center w-full border border-brand-300 rounded-2xl py-4 bg-white"
      >
        <Image
          source={icons.google}
          className="w-5 h-5 mr-3"
          resizeMode="contain"
        />
        <Text className="text-base text-black font-JakartaSemiBold">
          Continue with Google
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default OAuth;