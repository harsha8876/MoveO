import { router } from "expo-router";
import { Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import GoogleTextInput from "@/components/GoogleTextInput";
import RideLayout from "@/components/RideLayout";
import { icons } from "@/constants";
import { useLocationStore } from "@/store";

const FindRide = () => {
  const {
    userAddress,
    destinationAddress,
    setDestinationLocation,
    setUserLocation,
  } = useLocationStore();

  return (
    <RideLayout title="Ride">
      {/* FROM */}
      <View className="my-3 z-20">
        <Text className="mb-3 text-lg font-JakartaSemiBold">From</Text>

        <GoogleTextInput
          icon={icons.target}
          initialLocation={userAddress || "Your current location"}
          containerStyle="bg-[#EDEDF5]"
          textInputBackgroundColor="#EDEDF5"
          handlePress={(location) => setUserLocation(location)}
        />
      </View>

      {/* TO */}
      <View className="my-3 z-10">
        <Text className="mb-3 text-lg font-JakartaSemiBold">To</Text>

        <GoogleTextInput
          icon={icons.map}
          initialLocation={destinationAddress || "Where do you want to go?"}
          containerStyle="bg-[#EDEDF5]"
          textInputBackgroundColor="#EDEDF5"
          handlePress={(location) => setDestinationLocation(location)}
        />
      </View>

      {/* BUTTON */}
      <CustomButton
        title="Find Now"
        onPress={() => router.push("/(root)/confirm-ride")}
        className="mt-5 bg-[#747490]"
      />
    </RideLayout>
  );
};

export default FindRide;