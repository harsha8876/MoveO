import { router } from "expo-router";
import { TouchableOpacity, View, Text } from "react-native";

export default function ConfirmRide() {
  return <View className="flex-1 bg-black items-center justify-center" >
    <TouchableOpacity className="bg-white px-4 py-2 rounded" onPress={() => router.back()}>
      <Text className="text-black">back</Text>
    </TouchableOpacity>
  </View>;
}
