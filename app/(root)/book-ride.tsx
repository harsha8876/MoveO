import Payment from "@/components/Payment";
import RideLayout from "@/components/RideLayout";
import { icons } from "@/constants";
import { formatCurrency, formatTime } from "@/lib/utils";
import { useDriverStore, useLocationStore } from "@/store";
import { MarkerData } from "@/types/type";
import { useUser } from "@clerk/expo";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Image, Text, View } from "react-native";

const BookRide = () => {
  const { user } = useUser();
  const { userAddress, destinationAddress } = useLocationStore();
  const { drivers, selectedDriver } = useDriverStore();
  const driverDetails = drivers?.filter(
    (driver) =>
      ((driver as MarkerData & { driver_id?: number }).id ??
        (driver as MarkerData & { driver_id?: number }).driver_id) ===
      selectedDriver,
  )[0];

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      merchantIdentifier="merchant.moveo.com"
      urlScheme="moveo"
    >
      <RideLayout title="Book Ride">
        <Text className="text-xl font-JakartaSemiBold mb-3">
          Ride Information
        </Text>

        <View className="flex flex-col w-full items-center justify-center mt-10">
          <Image
            source={{ uri: driverDetails?.profile_image_url }}
            className="w-28 h-28 rounded-full"
          />

          <View className="flex flex-row items-center justify-center mt-5 space-x-2">
            <Text className="text-lg font-JakartaSemiBold">
              {driverDetails
                ? `${driverDetails.first_name} ${driverDetails.last_name}`
                : ""}
            </Text>

            <View className="flex flex-row items-center space-x-0.5">
              <Image
                source={icons.star}
                className="w-5 h-5"
                resizeMode="contain"
              />
              <Text className="text-lg font-JakartaRegular">
                {driverDetails?.rating}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex flex-col w-full items-start justify-center py-3 px-5 rounded-3xl bg-[#B9B9C7] mt-5">
          <View className="flex flex-row items-center justify-between w-full border-b border-white py-3">
            <Text className="text-lg font-JakartaRegular text-[#46466B]">
              Ride Price
            </Text>
            <Text className="text-lg font-JakartaSemiBold text-[#5D5D7D]">
              {formatCurrency(driverDetails?.price)}
            </Text>
          </View>

          <View className="flex flex-row items-center justify-between w-full border-b border-white py-3">
            <Text className="text-lg font-JakartaRegular text-[#46466B]">
              Pickup Time
            </Text>
            <Text className="text-lg font-JakartaRegular text-[#5D5D7D]">
              {formatTime(driverDetails?.time!)}
            </Text>
          </View>

          <View className="flex flex-row items-center justify-between w-full py-3">
            <Text className="text-lg font-JakartaRegular text-[#46466B]">
              Car Seats
            </Text>
            <Text className="text-lg font-JakartaRegular text-[#5D5D7D]">
              {driverDetails?.car_seats}
            </Text>
          </View>
        </View>

        <View className="flex flex-col w-full items-start justify-center mt-5">
          <View className="flex flex-row items-center justify-start mt-3 border-t border-b border-[#A2A2B5] w-full py-3">
            <Image source={icons.to} className="w-6 h-6" />
            <Text className="text-lg font-JakartaRegular ml-2">
              {userAddress}
            </Text>
          </View>

          <View className="flex flex-row items-center justify-start border-b border-[#A2A2B5] w-full py-3">
            <Image source={icons.point} className="w-6 h-6" />
            <Text className="text-lg font-JakartaRegular ml-2">
              {destinationAddress}
            </Text>
          </View>
        </View>
        <Payment
          fullName={user?.fullName!}
          email={user?.emailAddresses[0].emailAddress!}
          amount={driverDetails?.price!}
          driverId={driverDetails?.id}
          driverName={
            driverDetails
              ? `${driverDetails.first_name} ${driverDetails.last_name}`
              : "your driver"
          }
          driverAvatar={driverDetails?.profile_image_url}
          rideTime={driverDetails?.time!}
        />
      </RideLayout>
    </StripeProvider>
  );
};

export default BookRide;
