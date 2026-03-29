import { icons } from "@/constants";
import { router } from "expo-router";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { useRef, useMemo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Map from "./Map";

export default function RideLayout({title,children}:{title:string,children:React.ReactNode}) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-white">
            <View className="flex flex-col h-screen bg-blue-500">
                <View className="flex flex-row absolute z-10 top-16 items-center justify-start px-5">
                    <TouchableOpacity onPress={()=>router.back()}>
                        <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
                            <Image source={icons.backArrow} resizeMode="contain" className="w-6 h-6"/>
                        </View>
                    </TouchableOpacity>
                    <Text className="text-xl font-JakartaSemiBold ml-5">
                        {title || 'Go back'}
                    </Text>
                </View>
                <Map/>
            </View>
            <BottomSheet
              ref={bottomSheetRef}
              index={0}
              snapPoints={["25%", "50%"]}
              enableBlurKeyboardOnGesture={false}
            >
                <BottomSheetScrollView
                  style={{flex:1, padding:20}}
                  keyboardShouldPersistTaps="always"
                  keyboardDismissMode="none"
                >
                    {children}
                </BottomSheetScrollView>
            </BottomSheet>
        </View>
    </GestureHandlerRootView>
  );
}
