import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import RideCard from "@/components/RideCard";
import { fetchAPI } from "@/lib/fetch";
import { formatCurrency, formatRideTime, getShortAddress } from "@/lib/utils";

export default function RidesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const isFocused = useIsFocused();
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadRides = useCallback(
    async (refresh = false) => {
      if (!user?.id) {
        setRides([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      try {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const response = await fetchAPI(`/(api)/(ride)/${user.id}`);
        setRides(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        setRides([]);
        console.error("Unable to fetch rides history:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    if (!isLoaded || !isFocused) return;

    void loadRides();
  }, [isFocused, isLoaded, loadRides]);

  const paidRides = rides.filter((ride) => ride.payment_status === "paid");
  const totalSpent = paidRides.reduce(
    (sum, ride) => sum + Number(ride.fare_price ?? 0),
    0,
  );
  const totalRideMinutes = rides.reduce(
    (sum, ride) => sum + Number(ride.ride_time ?? 0),
    0,
  );
  const latestDestination =
    rides.length > 0
      ? getShortAddress(rides[0].destination_address)
      : "No trips yet";

  return (
    <SafeAreaView className="flex-1 bg-[#FFFFFF]">
      <FlatList
        data={rides}
        keyExtractor={(item, index) =>
          `${item.created_at}-${item.destination_address}-${index}`
        }
        renderItem={({ item }) => <RideCard ride={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void loadRides(true);
            }}
            tintColor="#5D5D7D"
          />
        }
        ListHeaderComponent={
          <View className="px-5 pb-4 pt-3">
            <View className="mb-6 flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-3xl text-[#2F2F42] font-JakartaBold">
                  Your rides
                </Text>
                <Text className="mt-2 text-sm leading-6 text-[#46466B] font-JakartaRegular">
                  Track every trip, review fare details, and quickly revisit
                  your recent destinations.
                </Text>
              </View>

              <View className="rounded-2xl bg-[#D6D6E0] px-4 py-3">
                <Text className="text-xs uppercase tracking-[1px] text-[#747490] font-JakartaMedium">
                  HISTORY
                </Text>
                <Text className="mt-1 text-lg text-[#2F2F42] font-JakartaBold">
                  {isLoading ? "..." : rides.length}
                </Text>
              </View>
            </View>

            <View className="mb-6 flex-row justify-between">
              <View className="mr-3 flex-1 rounded-[24px] bg-[#D6D6E0] p-4">
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

              <View className="flex-1 rounded-[24px] bg-[#D6D6E0] p-4">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-[#B9B9C7]">
                  <Ionicons name="time-outline" size={20} color="#5D5D7D" />
                </View>
                <Text className="mt-4 text-sm text-[#46466B] font-JakartaMedium">
                  Time on road
                </Text>
                <Text className="mt-1 text-2xl text-[#2F2F42] font-JakartaBold">
                  {formatRideTime(totalRideMinutes)}
                </Text>
              </View>
            </View>

            <View className="mb-4 rounded-[28px] bg-[#A2A2B5] p-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-sm text-[#46466B] font-JakartaMedium">
                    Latest destination
                  </Text>
                  <Text className="mt-1 text-xl text-[#2F2F42] font-JakartaBold">
                    {latestDestination}
                  </Text>
                </View>

                <View className="h-12 w-12 items-center justify-center rounded-full bg-[#D6D6E0]">
                  <Ionicons name="navigate-outline" size={22} color="#46466B" />
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
                    Last pickup
                  </Text>
                  <Text className="mt-2 text-sm leading-5 text-[#2F2F42] font-JakartaBold">
                    {rides.length > 0
                      ? getShortAddress(rides[0].origin_address)
                      : "Not available"}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-xl text-[#2F2F42] font-JakartaBold">
                  Trip history
                </Text>
                <Text className="mt-1 text-sm text-[#46466B] font-JakartaRegular">
                  Pull to refresh if you want to fetch your latest completed rides.
                </Text>
              </View>

              <TouchableOpacity
                className="rounded-full bg-[#D6D6E0] px-4 py-2"
                onPress={() => router.push("/(root)/(tabs)/home")}
              >
                <Text className="text-sm text-[#2F2F42] font-JakartaBold">
                  Book now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        
        ListEmptyComponent={
          isLoading ? (
            <View className="flex-1 items-center justify-center px-5 pt-8">
              <ActivityIndicator size="small" color="#5D5D7D" />
              <Text className="mt-3 text-sm text-[#46466B] font-JakartaMedium">
                Loading your rides...
              </Text>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center px-5">
              <View className="w-full rounded-[28px] bg-[#D6D6E0] p-6">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-[#B9B9C7]">
                  <Ionicons
                    name="car-sport-outline"
                    size={24}
                    color="#5D5D7D"
                  />
                </View>
                <Text className="mt-5 text-2xl text-[#2F2F42] font-JakartaBold">
                  No rides yet
                </Text>
                <Text className="mt-2 text-sm leading-6 text-[#46466B] font-JakartaRegular">
                  Your completed and upcoming trips will appear here once you
                  book your first ride.
                </Text>

                <TouchableOpacity
                  className="mt-5 self-start rounded-full bg-[#5D5D7D] px-5 py-3"
                  onPress={() => router.push("/(root)/(tabs)/home")}
                >
                  <Text className="text-sm text-white font-JakartaBold">
                    Start booking
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
