import { icons } from "@/constants";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import React, { useMemo, useRef } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Map from "./Map";

export default function RideLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["25%", "50%", "80%"], []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-white">
        <View className="flex-1 bg-blue-500">
          <View className="absolute top-16 z-10 flex-row items-center justify-start px-5">
            <TouchableOpacity onPress={() => router.back()}>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
                <Image
                  source={icons.backArrow}
                  resizeMode="contain"
                  className="h-6 w-6"
                />
              </View>
            </TouchableOpacity>
            <Text className="ml-5 text-xl font-JakartaSemiBold text-black">
              {title || "Go back"}
            </Text>
          </View>

          <Map />
        </View>

        <BottomSheet
          ref={bottomSheetRef}
          index={2}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
          keyboardBehavior="extend"
          keyboardBlurBehavior="restore"
          enableContentPanningGesture
        >
          <BottomSheetView style={{ padding: 20, paddingBottom: 40, flex: 1 }}>
            <View className="flex-1">{children}</View>
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
