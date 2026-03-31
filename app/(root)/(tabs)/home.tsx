import { Ionicons } from "@expo/vector-icons";
import { useClerk, useUser } from "@clerk/expo";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GoogleTextInput from "@/components/GoogleTextInput";
import Map from "@/components/Map";
import RideCard from "../../../components/RideCard";
import { fetchAPI } from "@/lib/fetch";
import {
  formatCurrency,
  formatRideTime,
  getShortAddress,
} from "../../../lib/utils";
import { router } from "expo-router";
import { useLocationStore } from "@/store";

export default function HomePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [isRidesLoading, setIsRidesLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const {
    userAddress,
    destinationAddress,
    setUserLocation,
    setDestinationLocation,
  } = useLocationStore();

  const handleDestinationPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setDestinationLocation(location);
    router.push("/(root)/find-ride");
  };

  useEffect(() => {
    let isActive = true;

    const loadRecentRides = async () => {
      if (!user?.id) {
        if (isActive) {
          setRecentRides([]);
          setIsRidesLoading(false);
        }
        return;
      }

      try {
        setIsRidesLoading(true);
        const response = await fetchAPI(`/(api)/(ride)/${user.id}`);

        if (isActive) {
          setRecentRides(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (error) {
        if (isActive) {
          setRecentRides([]);
        }
        console.error("Unable to fetch recent rides:", error);
      } finally {
        if (isActive) {
          setIsRidesLoading(false);
        }
      }
    };

    loadRecentRides();

    return () => {
      isActive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    const requestLocation = async () => {
      try {
        setIsLocating(true);
        setLocationError(null);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Location permission denied");
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: `${address[0]?.name ?? "Current location"}, ${address[0]?.region ?? ""}`,
        });
      } catch {
        setLocationError("Unable to fetch current location");
      } finally {
        setIsLocating(false);
      }
    };

    requestLocation();
  }, [setUserLocation]);

  const emailPrefix =
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "traveler";
  const firstName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  const paidRides = recentRides.filter(
    (ride) => ride.payment_status === "paid",
  );
  const totalSpent = paidRides.reduce(
    (sum, ride) => sum + Number(ride.fare_price ?? 0),
    0,
  );
  const totalRideMinutes = recentRides.reduce(
    (sum, ride) => sum + Number(ride.ride_time ?? 0),
    0,
  );

  return (
    <SafeAreaView className="flex-1 bg-[#ffffff]">
      <FlatList
        data={recentRides.slice(0, 5)}
        keyExtractor={(item) => String(item.ride_id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <View className="px-5 pb-4 pt-3">
            <View className="mb-5 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-sm text-[#46466B] font-JakartaMedium">
                  Welcome back
                </Text>
                <Text className="mt-1 text-3xl text-[#2F2F42] font-JakartaBold">
                  {firstName}
                </Text>
              </View>

              <TouchableOpacity
                className="h-12 w-12 items-center justify-center rounded-full bg-[#D6D6E0]"
                onPress={() => {
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
                }}
              >
                <Ionicons name="log-out-outline" size={22} color="#46466B" />
              </TouchableOpacity>
            </View>

            <View className="mb-6 rounded-[28px] bg-[#5D5D7D] px-5 py-5">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-sm text-[#D6D6E0] font-JakartaMedium">
                    Current location
                  </Text>
                  <Text className="mt-2 text-2xl text-white font-JakartaBold">
                    {userAddress
                      ? getShortAddress(userAddress)
                      : "Finding you..."}
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-[#F3F3F7] font-JakartaRegular">
                    Search for a destination and preview your route from where
                    you are right now.
                  </Text>
                </View>

                <View className="rounded-2xl bg-[#46466B] px-4 py-3">
                  <Text className="text-xs uppercase tracking-[1px] text-[#D6D6E0] font-JakartaMedium">
                    STATUS
                  </Text>
                  <Text className="mt-1 text-lg text-white font-JakartaBold">
                    {isLocating
                      ? "Loading"
                      : locationError
                        ? "Blocked"
                        : "Ready"}
                  </Text>
                </View>
              </View>

              <View className="mt-5">
                <GoogleTextInput
                  initialLocation={
                    destinationAddress ?? "Where do you want to go today?"
                  }
                  containerStyle="bg-[#D6D6E0] px-1 py-1"
                  textInputBackgroundColor="#D6D6E0"
                  handlePress={handleDestinationPress}
                />
              </View>
            </View>

            <View className="mb-6">
              {isLocating ? (
                <View className="h-52 items-center justify-center rounded-[28px] bg-[#D6D6E0]">
                  <ActivityIndicator size="small" color="#5D5D7D" />
                  <Text className="mt-3 text-sm text-[#46466B] font-JakartaMedium">
                    Fetching current location...
                  </Text>
                </View>
              ) : (
                <View className="h-52 overflow-hidden rounded-[28px]">
                  <Map />
                </View>
              )}
              <View className="mt-3 flex-row items-center justify-between px-1">
                <View className="flex-1 pr-3">
                  <Text className="text-xs uppercase tracking-[1px] text-[#7A7F8C] font-JakartaMedium">
                    Your location
                  </Text>
                  <Text className="mt-1 text-sm text-[#2F2F42] font-JakartaBold">
                    {userAddress ?? locationError ?? "Unavailable"}
                  </Text>
                </View>

                {destinationAddress ? (
                  <View className="flex-1">
                    <Text className="text-xs uppercase tracking-[1px] text-[#7A7F8C] font-JakartaMedium">
                      Destination
                    </Text>
                    <Text className="mt-1 text-sm text-[#2F2F42] font-JakartaBold">
                      {getShortAddress(destinationAddress)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View className="mb-6 flex-row justify-between">
              <View className="mr-3 flex-1 rounded-[24px] bg-[#D6D6E0] p-4">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-[#B9B9C7]">
                  <Ionicons
                    name="car-sport-outline"
                    size={20}
                    color="#5D5D7D"
                  />
                </View>
                <Text className="mt-4 text-sm text-[#46466B] font-JakartaMedium">
                  Total rides
                </Text>
                <Text className="mt-1 text-2xl text-[#2F2F42] font-JakartaBold">
                  {isRidesLoading ? "..." : recentRides.length}
                </Text>
              </View>

              <View className="flex-1 rounded-[24px] bg-[#D6D6E0] p-4">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-[#B9B9C7]">
                  <Ionicons name="wallet-outline" size={20} color="#5D5D7D" />
                </View>
                <Text className="mt-4 text-sm text-[#46466B] font-JakartaMedium">
                  Amount spent
                </Text>
                <Text className="mt-1 text-2xl text-[#2F2F42] font-JakartaBold">
                  {formatCurrency(totalSpent)}
                </Text>
              </View>
            </View>

            <View className="mb-6 rounded-[28px] bg-[#A2A2B5] p-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-sm text-[#46466B] font-JakartaMedium">
                    This week
                  </Text>
                  <Text className="mt-1 text-xl text-[#2F2F42] font-JakartaBold">
                    {formatRideTime(totalRideMinutes)} on the road
                  </Text>
                </View>

                <View className="h-12 w-12 items-center justify-center rounded-full bg-[#D6D6E0]">
                  <Ionicons name="time-outline" size={22} color="#46466B" />
                </View>
              </View>

              <View className="mt-5 flex-row justify-between">
                <View className="mr-3 flex-1 rounded-2xl bg-[#D6D6E0] p-4">
                  <Text className="text-xs uppercase tracking-[1px] text-[#46466B] font-JakartaMedium">
                    Paid rides
                  </Text>
                  <Text className="mt-2 text-xl text-[#2F2F42] font-JakartaBold">
                    {paidRides.length}
                  </Text>
                </View>

                <View className="flex-1 rounded-2xl bg-[#D6D6E0] p-4">
                  <Text className="text-xs uppercase tracking-[1px] text-[#46466B] font-JakartaMedium">
                    Favorite route
                  </Text>
                  <Text className="mt-2 text-sm leading-5 text-[#2F2F42] font-JakartaBold">
                    {getShortAddress(recentRides[0]?.destination_address)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-xl text-[#2F2F42] font-JakartaBold">
                  Recent rides
                </Text>
                <Text className="mt-1 text-sm text-[#46466B] font-JakartaRegular">
                  Review your latest trips and fare details.
                </Text>
              </View>

              <TouchableOpacity
                className="rounded-full bg-[#D6D6E0] px-4 py-2"
                onPress={() => router.push("/(root)/(tabs)/rides")}
              >
                <Text className="text-sm text-[#2F2F42] font-JakartaBold">
                  See all
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          isRidesLoading ? (
            <View className="px-5 pt-4">
              <ActivityIndicator size="small" color="#5D5D7D" />
            </View>
          ) : (
            <View className="px-5 pt-2">
              <Text className="text-sm text-[#46466B] font-JakartaRegular">
                No rides yet. Book your first ride to see it here.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => <RideCard ride={item} />}
      />
    </SafeAreaView>
  );
}
