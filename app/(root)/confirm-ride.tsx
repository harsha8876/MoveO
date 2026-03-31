import CustomButton from "@/components/CustomButton";
import DriverCard from "@/components/DriverCard";
import RideLayout from "@/components/RideLayout";
import { useDriverStore } from "@/store";
import { MarkerData } from "@/types/type";
import { router } from "expo-router";
import { View } from "react-native";

const ConfirmRide = () => {
  const { drivers, selectedDriver, setSelectedDriver } = useDriverStore();

  return (
    <RideLayout title={"Choose a Rider"}>
      {drivers.map((item, index) => (
        <DriverCard
          key={`${
            (item as MarkerData & { driver_id?: number }).id ??
            (item as MarkerData & { driver_id?: number }).driver_id ??
            index
          }`}
          item={item}
          selected={selectedDriver!}
          setSelected={() => {
            const driverId =
              (item as MarkerData & { driver_id?: number }).id ??
              (item as MarkerData & { driver_id?: number }).driver_id;

            if (driverId != null) {
              setSelectedDriver(driverId);
            }
          }}
        />
      ))}
      <View className="mt-10">
        <CustomButton
          title="Select Ride"
          onPress={() => router.push("/(root)/book-ride")}
          className="bg-[#8B8BA2]"
        />
      </View>
    </RideLayout>
  );
};

export default ConfirmRide;
