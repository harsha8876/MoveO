import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { View } from "react-native";
import { MarkerData } from "@/types/type";
import CustomButton from "@/components/CustomButton";
import DriverCard from "@/components/DriverCard";
import RideLayout from "@/components/RideLayout";
import { useDriverStore } from "@/store";

const ConfirmRide = () => {
  const { drivers, selectedDriver, setSelectedDriver } = useDriverStore();

  return (
    <RideLayout title={"Choose a Rider"}>
      <BottomSheetFlatList
        data={drivers}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <DriverCard
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
        )}
        ListFooterComponent={() => (
          <View className="mx-5 mt-10">
            <CustomButton
              title="Select Ride"
              onPress={() => router.push("/(root)/book-ride")}
              className="bg-[#8B8BA2]"
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </RideLayout>
  );
};

export default ConfirmRide;
