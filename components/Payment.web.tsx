import React from "react";
import { Text, View } from "react-native";
import { PaymentProps } from "@/types/type";

const Payment = (_props: PaymentProps) => (
  <View className="my-10 items-center">
    <Text className="text-gray-500 text-sm">
      Payments are only available on the mobile app.
    </Text>
  </View>
);

export default Payment;
