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
import {
  formatCurrency,
  formatRideTime,
  getShortAddress,
} from "../../../lib/utils";
import { router } from "expo-router";
import { useLocationStore } from "@/store";

const recentRides = [
  {
    ride_id: "1",
    origin_address: "Kathmandu, Nepal",
    destination_address: "Pokhara, Nepal",
    origin_latitude: "27.717245",
    origin_longitude: "85.323961",
    destination_latitude: "28.209583",
    destination_longitude: "83.985567",
    ride_time: 391,
    fare_price: "19500.00",
    payment_status: "failed",
    driver_id: 2,
    user_id: "1",
    created_at: "2024-08-12 05:19:20.620007",
    driver: {
      driver_id: "2",
      first_name: "David",
      last_name: "Brown",
      profile_image_url:
        "https://ucarecdn.com/6ea6d83d-ef1a-483f-9106-837a3a5b3f67/-/preview/1000x666/",
      car_image_url:
        "https://ucarecdn.com/a3872f80-c094-409c-82f8-c9ff38429327/-/preview/930x932/",
      car_seats: 5,
      rating: "4.60",
    },
  },
  {
    ride_id: "2",
    origin_address: "Jalkot, MH",
    destination_address: "Pune, Maharashtra, India",
    origin_latitude: "18.609116",
    origin_longitude: "77.165873",
    destination_latitude: "18.520430",
    destination_longitude: "73.856744",
    ride_time: 491,
    fare_price: "24500.00",
    payment_status: "paid",
    driver_id: 1,
    user_id: "1",
    created_at: "2024-08-12 06:12:17.683046",
    driver: {
      driver_id: "1",
      first_name: "James",
      last_name: "Wilson",
      profile_image_url:
        "https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/",
      car_image_url:
        "https://ucarecdn.com/a2dc52b2-8bf7-4e49-9a36-3ffb5229ed02/-/preview/465x466/",
      car_seats: 4,
      rating: "4.80",
    },
  },
  {
    ride_id: "3",
    origin_address: "Zagreb, Croatia",
    destination_address: "Rijeka, Croatia",
    origin_latitude: "45.815011",
    origin_longitude: "15.981919",
    destination_latitude: "45.327063",
    destination_longitude: "14.442176",
    ride_time: 124,
    fare_price: "6200.00",
    payment_status: "paid",
    driver_id: 1,
    user_id: "1",
    created_at: "2024-08-12 08:49:01.809053",
    driver: {
      driver_id: "1",
      first_name: "James",
      last_name: "Wilson",
      profile_image_url:
        "https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/",
      car_image_url:
        "https://ucarecdn.com/a2dc52b2-8bf7-4e49-9a36-3ffb5229ed02/-/preview/465x466/",
      car_seats: 4,
      rating: "4.80",
    },
  },
  {
    ride_id: "4",
    origin_address: "Okayama, Japan",
    destination_address: "Osaka, Japan",
    origin_latitude: "34.655531",
    origin_longitude: "133.919795",
    destination_latitude: "34.693725",
    destination_longitude: "135.502254",
    ride_time: 159,
    fare_price: "7900.00",
    payment_status: "paid",
    driver_id: 3,
    user_id: "1",
    created_at: "2024-08-12 18:43:54.297838",
    driver: {
      driver_id: "3",
      first_name: "Michael",
      last_name: "Johnson",
      profile_image_url:
        "https://ucarecdn.com/0330d85c-232e-4c30-bd04-e5e4d0e3d688/-/preview/826x822/",
      car_image_url:
        "https://ucarecdn.com/289764fb-55b6-4427-b1d1-f655987b4a14/-/preview/930x932/",
      car_seats: 4,
      rating: "4.70",
    },
  },
];

const paidRides = recentRides.filter((ride) => ride.payment_status === "paid");
const totalSpent = paidRides.reduce(
  (sum, ride) => sum + Number(ride.fare_price ?? 0),
  0,
);
const totalRideMinutes = recentRides.reduce(
  (sum, ride) => sum + Number(ride.ride_time ?? 0),
  0,
);

export default function HomePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isLocating, setIsLocating] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const {
    userAddress,
    destinationAddress,
    setUserLocation,
    setDestinationLocation,
  } = useLocationStore();

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

  return (
    <SafeAreaView className="flex-1 bg-[#ffffff]">
      <FlatList
        data={recentRides.slice(0, 5)}
        keyExtractor={(item) => item.ride_id}
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
                  handlePress={(location) => setDestinationLocation(location)}
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
                  {recentRides.length}
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
                    {getShortAddress(recentRides[1]?.destination_address)}
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

              <TouchableOpacity className="rounded-full bg-[#D6D6E0] px-4 py-2">
                <Text className="text-sm text-[#2F2F42] font-JakartaBold">
                  See all
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => <RideCard ride={item} />}
      />
    </SafeAreaView>
  );
}
