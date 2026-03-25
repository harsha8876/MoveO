import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";

type CustomButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
};

const CustomButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  className = "",
  textClassName = "",
  ...props
}: CustomButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`items-center justify-center rounded-2xl bg-primary py-4 ${disabled ? "opacity-50" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className={`text-white text-base font-JakartaBold ${textClassName}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

export default CustomButton;