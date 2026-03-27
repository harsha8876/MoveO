import { Ionicons } from "@expo/vector-icons";
import { Image, Text, View } from "react-native";
import { formatCurrency, formatRideTime, getShortAddress, getCoordinate } from "../lib/utils";

type Driver = {
  driver_id?: string | number;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  car_image_url?: string;
  car_seats?: number;
  rating?: string | number;
  
};

type Ride = {
  ride_id?: string | number;
  origin_address?: string;
  destination_address?: string;
  origin_latitude?: string | number;
  origin_longitude?: string | number;
  destination_latitude?: string | number;
  destination_longitude?: string | number;
  ride_time?: number;
  fare_price?: string | number;
  payment_status?: string;
  created_at?: string;
  driver?: Driver;
};

type RideCardProps = {
  ride: Ride;
};




const buildMapImageUrl = (ride: Ride) => {
  const originLat = getCoordinate(ride.origin_latitude);
  const originLon = getCoordinate(ride.origin_longitude);
  const destinationLat = getCoordinate(ride.destination_latitude);
  const destinationLon = getCoordinate(ride.destination_longitude);

  if (
    originLat === null ||
    originLon === null ||
    destinationLat === null ||
    destinationLon === null
  ) {
    return null;
  }

  const centerLon = (originLon + destinationLon) / 2;
  const centerLat = (originLat + destinationLat) / 2;
  const center = encodeURIComponent(`lonlat:${centerLon},${centerLat}`);
  const markers = encodeURIComponent(
    [
      `lonlat:${originLon},${originLat};type:awesome;color:%230A7EA4;size:large;icon:circle`,
      `lonlat:${destinationLon},${destinationLat};type:awesome;color:%2346466B;size:large;icon:flag-checkered`,
    ].join("|"),
  );

  return `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:${ride.destination_longitude},${ride.destination_latitude}&zoom=14&apiKey=${process.env.EXPO_PUBLIC_GEOAPIFY_KEY}`;
};

const RideCard = ({ ride }: RideCardProps) => {
  const driverName =
    `${ride.driver?.first_name ?? "Assigned"} ${ride.driver?.last_name ?? "driver"}`.trim();
  const paymentStatus = ride.payment_status ?? "pending";
  const mapImageUrl = buildMapImageUrl(ride);
  const createdAt = ride.created_at
    ? new Date(ride.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recent trip";

  return (
    <View
      className="mx-5 mb-4 rounded-3xl p-4 shadow-sm"
      style={{ backgroundColor: "#B9B9C7" }}
    >
      <View className="mb-4 flex-row gap-3">
        {mapImageUrl ? (
          <Image
            source={{ uri: mapImageUrl }}
            className="h-24 w-24 rounded-2xl"
            resizeMode="cover"
          />
        ) : null}

        <View className="flex-1 justify-between">
          <View>
            <Text className="text-xs uppercase tracking-[1px] text-[#46466B] font-JakartaMedium">
              {createdAt}
            </Text>

            <Text className="mt-1 text-sm text-[#46466B] font-JakartaBold">
              {getShortAddress(ride.origin_address)}
            </Text>

            <Text className="mt-1 text-xs text-[#46466B] font-JakartaRegular">
              to {getShortAddress(ride.destination_address)}
            </Text>
          </View>

          <View
            className="self-start rounded-full px-3 py-1 mt-2"
            style={{
              backgroundColor:
                paymentStatus.toLowerCase() === "paid"
                  ? "#6B8E6B"
                  : paymentStatus.toLowerCase() === "failed"
                  ? "#C96A6A"
                  : "#B9B9C7",
            }}
          >
            <Text
              className="text-xs capitalize font-JakartaBold"
              style={{ color: "#FFFFFF" }}
            >
              {paymentStatus}
            </Text>
          </View>
        </View>
      </View>

      <View className="mb-4 rounded-2xl bg-[#D6D6E0] p-3">
        <View className="flex-row">
          <View className="items-center pr-3">
            <View className="h-3 w-3 rounded-full bg-primary" />
            <View className="my-1 h-10 w-[2px] bg-[#747490]" />
            <Ionicons name="location" size={16} color="#0A7EA4" />
          </View>

          <View className="flex-1 justify-between">
            <View>
              <Text className="text-xs text-[#46466B] font-JakartaMedium">
                Pickup
              </Text>
              <Text className="text-sm text-[#46466B] font-JakartaSemiBold">
                {ride.origin_address ?? "Unknown location"}
              </Text>
            </View>

            <View className="mt-4">
              <Text className="text-xs text-[#46466B] font-JakartaMedium">
                Destination
              </Text>
              <Text className="text-sm text-[#46466B] font-JakartaSemiBold">
                {ride.destination_address ?? "Unknown location"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View>
            <Text className="text-sm text-[#46466B] font-JakartaBold">
              {driverName}
            </Text>
            <View className="mt-1 flex-row items-center">
              <Ionicons name="star" size={14} color="#F4B400" />
              <Text className="ml-1 text-xs text-[#46466B] font-JakartaMedium">
                {ride.driver?.rating ?? "New"} • {ride.driver?.car_seats ?? 0}{" "}
                seats
              </Text>
            </View>
          </View>
        </View>

        <View className="items-end">
          <Text className="text-lg text-[#46466B] font-JakartaBold">
            {formatCurrency(ride.fare_price)}
          </Text>
          <Text className="mt-1 text-xs text-[#46466B] font-JakartaMedium">
            {formatRideTime(ride.ride_time)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default RideCard;
