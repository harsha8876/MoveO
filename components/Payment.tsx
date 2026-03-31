import { useAuth } from "@clerk/expo";
import { useStripe } from "@stripe/stripe-react-native";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert } from "react-native";

import CustomButton from "@/components/CustomButton";
import SuccessModal from "@/components/SuccessModal";
import { fetchAPI } from "@/lib/fetch";
import { useLocationStore } from "@/store";
import { PaymentProps } from "@/types/type";

type PaymentSheetError = {
  code?: string;
  message?: string;
  localizedMessage?: string;
  declineCode?: string;
  stripeErrorCode?: string;
  type?: string;
};

const getPaymentSheetErrorMessage = (error: PaymentSheetError) => {
  const message =
    error.localizedMessage || error.message || "Unable to confirm payment.";
  const details = [
    error.code ? `Code: ${error.code}` : null,
    error.stripeErrorCode ? `Stripe: ${error.stripeErrorCode}` : null,
    error.declineCode ? `Decline: ${error.declineCode}` : null,
    error.type ? `Type: ${error.type}` : null,
  ].filter(Boolean);

  return details.length > 0 ? `${message}\n\n${details.join("\n")}` : message;
};

const Payment = ({
  fullName,
  email,
  amount,
  driverId,
  rideTime,
}: PaymentProps) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const {
    userAddress,
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationAddress,
    destinationLongitude,
  } = useLocationStore();
  const { userId } = useAuth();

  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isPaymentFlowActive = useRef(false);

  const amountValue = Number(amount);
  const amountInSmallestUnit = Math.round(amountValue * 100);

  const createRide = async () => {
    if (
      !userAddress ||
      !destinationAddress ||
      userLatitude == null ||
      userLongitude == null ||
      destinationLatitude == null ||
      destinationLongitude == null ||
      !driverId ||
      !userId
    ) {
      throw new Error("Missing required ride details.");
    }

    await fetchAPI("/(api)/(ride)/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        origin_address: userAddress,
        destination_address: destinationAddress,
        origin_latitude: userLatitude,
        origin_longitude: userLongitude,
        destination_latitude: destinationLatitude,
        destination_longitude: destinationLongitude,
        ride_time: rideTime.toFixed(0),
        fare_price: amountInSmallestUnit,
        payment_status: "paid",
        driver_id: driverId,
        user_id: userId,
      }),
    });
  };

  const initializePaymentSheet = async () => {
    try {
      const response = await fetchAPI("/(api)/(stripe)/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName || (email ? email.split("@")[0] : "Moveo User"),
          email,
          amount: amountValue,
        }),
      });

      if (response.error) {
        Alert.alert(
          "Payment setup failed",
          response.details ||
            response.error ||
            "Unable to create payment sheet.",
        );
        return false;
      }

      const paymentIntentClientSecret =
        response.paymentIntent?.client_secret ?? response.paymentIntent;
      const customerId = response.customer?.id ?? response.customer;
      const customerEphemeralKeySecret =
        response.ephemeralKey?.secret ?? response.ephemeralKey;

      if (
        !paymentIntentClientSecret ||
        !customerId ||
        !customerEphemeralKeySecret
      ) {
        Alert.alert(
          "Payment setup failed",
          "Stripe did not return the required payment sheet details.",
        );
        return false;
      }

      const { error } = await initPaymentSheet({
        merchantDisplayName: "Moveo",
        customerId,
        customerEphemeralKeySecret,
        paymentIntentClientSecret,
        defaultBillingDetails: {
          name: fullName || (email ? email.split("@")[0] : "Moveo User"),
          email,
        },
        returnURL: "moveo://book-ride",
      });

      if (error) {
        Alert.alert(
          "Payment setup failed",
          getPaymentSheetErrorMessage(error as PaymentSheetError),
        );
        return false;
      }

      return true;
    } catch (error) {
      Alert.alert(
        "Payment setup failed",
        error instanceof Error ? error.message : "Unable to prepare payment.",
      );
      return false;
    }
  };

  const openPaymentSheet = async () => {
    if (isPaymentFlowActive.current) return;

    if (!Number.isFinite(amountValue) || amountInSmallestUnit <= 0) {
      Alert.alert(
        "Invalid amount",
        "Please select a valid ride before paying.",
      );
      return;
    }

    try {
      isPaymentFlowActive.current = true;
      setIsLoading(true);

      const isInitialized = await initializePaymentSheet();
      if (!isInitialized) return;

      const { error } = await presentPaymentSheet();

      if (error) {
        Alert.alert(
          "Payment confirmation failed",
          getPaymentSheetErrorMessage(error as PaymentSheetError),
        );
        return;
      }

      await createRide();
      setSuccess(true);
    } catch (error) {
      Alert.alert(
        "Payment failed",
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      isPaymentFlowActive.current = false;
      setIsLoading(false);
    }
  };

  return (
    <>
      <CustomButton
        title={isLoading ? "Processing..." : "Confirm Ride"}
        className="my-10 bg-[#747490]"
        onPress={openPaymentSheet}
        loading={isLoading}
        disabled={isLoading}
      />

      <SuccessModal
        visible={success}
        title="Booking placed successfully"
        message="Thank you for your booking. Your reservation has been successfully placed. Please proceed with your trip."
        buttonTitle="Go to Home"
        buttonClassName="bg-[#747490]"
        onClose={() => setSuccess(false)}
        onConfirm={() => {
          setSuccess(false);
          router.replace("/(root)/(tabs)/home");
        }}
      />
    </>
  );
};

export default Payment;
