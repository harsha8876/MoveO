import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { MarkerData } from "@/types/type";
import { icons } from "@/constants";
import { DriverCardProps } from "@/types/type";
import { formatCurrency, formatRideTime } from "@/lib/utils";

const DriverCard = ({ item, selected, setSelected }: DriverCardProps) => {
    const driverItem = item as MarkerData & { driver_id?: number };
    const driverId = driverItem.id ?? driverItem.driver_id ?? null;
    const driverName = `${item.first_name} ${item.last_name}`;
    const isSelected = selected === driverId;
    const hasPrice = item.price != null && item.price !== "";
    const hasTime = item.time != null && !Number.isNaN(item.time);

    return (
        <TouchableOpacity
            onPress={setSelected}
            activeOpacity={0.8}
            className={`flex flex-row items-center justify-between rounded-2xl px-4 py-4 mb-3 ${
                isSelected ? "bg-[#5D5D7D]" : "bg-[#B9B9C7]"
            }`}
        >
            <Image
                source={{uri: item.profile_image_url}}
                className="w-14 h-14 rounded-full"
            />

            <View className="flex-1 flex flex-col items-start justify-center mx-3">
                <View className="flex flex-row items-center justify-start mb-1">
                    <Text className={`text-lg font-JakartaSemiBold ${isSelected ? "text-white" : "text-[#46466B]"}`}>
                        {driverName}
                    </Text>

                    <View className="flex flex-row items-center ml-2">
                        <Image source={icons.star} className="w-3.5 h-3.5"/>
                        <Text className={`text-sm font-JakartaRegular ml-1 ${isSelected ? "text-white" : "text-[#5D5D7D]"}`}>
                            {item.rating}
                        </Text>
                    </View>
                </View>

                <View className="flex flex-row items-center justify-start">
                    {hasTime ? (
                        <Text className={`text-sm font-JakartaRegular ${isSelected ? "text-[#EDEDF5]" : "text-[#5D5D7D]"}`}>
                            {formatRideTime(Math.round(item.time!))}
                        </Text>
                    ) : null}

                    {hasTime && hasPrice ? (
                        <Text className={`mx-1 text-sm font-JakartaRegular ${isSelected ? "text-[#EDEDF5]" : "text-[#5D5D7D]"}`}>
                            |
                        </Text>
                    ) : null}

                    {hasPrice ? (
                        <Text className={`text-sm font-JakartaRegular ${isSelected ? "text-[#EDEDF5]" : "text-[#5D5D7D]"}`}>
                            {formatCurrency(item.price)}
                        </Text>
                    ) : null}

                    {(hasTime || hasPrice) ? (
                        <Text className={`mx-1 text-sm font-JakartaRegular ${isSelected ? "text-[#EDEDF5]" : "text-[#5D5D7D]"}`}>
                            |
                        </Text>
                    ) : null}

                    <Text className={`text-sm font-JakartaRegular ${isSelected ? "text-[#EDEDF5]" : "text-[#5D5D7D]"}`}>
                        {item.car_seats} seats
                    </Text>
                </View>
            </View>

            <Image
                source={{uri: item.car_image_url}}
                className="h-14 w-14"
                resizeMode="contain"
            />
        </TouchableOpacity>
    );
};

export default DriverCard;
