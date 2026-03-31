import React from "react";
import { Image, Text, View } from "react-native";
import { ReactNativeModal } from "react-native-modal";

import CustomButton from "@/components/CustomButton";
import { images } from "@/constants";

type SuccessModalProps = {
  visible: boolean;
  title: string;
  message: string;
  buttonTitle?: string;
  buttonClassName?: string;
  onClose: () => void;
  onConfirm: () => void;
};

const SuccessModal = ({
  visible,
  title,
  message,
  buttonTitle = "Continue",
  buttonClassName = "bg-[#747490]",
  onClose,
  onConfirm,
}: SuccessModalProps) => {
  return (
    <ReactNativeModal isVisible={visible} onBackdropPress={onClose}>
      <View className="flex flex-col items-center justify-center rounded-2xl bg-white p-7">
        <Image source={images.check} className="mt-5 h-28 w-28" />

        <Text className="mt-5 text-center font-JakartaBold text-2xl">
          {title}
        </Text>

        <Text className="mt-3 text-center font-JakartaRegular text-md text-general-200">
          {message}
        </Text>

        <CustomButton
          title={buttonTitle}
          onPress={onConfirm}
          className={`mt-5 ${buttonClassName}`}
        />
      </View>
    </ReactNativeModal>
  );
};

export default SuccessModal;
