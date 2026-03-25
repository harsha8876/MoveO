

import React from "react";
import { View, Text, TextInput } from "react-native";

type InputFieldProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?:
    | "default"
    | "email-address"
    | "numeric"
    | "phone-pad"
    | "number-pad";
  className?: string;
};

const InputFields = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  className = "",
}: InputFieldProps) => {
  return (
    <View className={`w-full mb-4 ${className}`}>
      {label && (
        <Text className="mb-2 text-sm text-primaryDark font-JakartaSemiBold">
          {label}
        </Text>
      )}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8B8BA2"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        className="rounded-2xl border border-brand-300 bg-white px-4 py-4 text-base text-black"
      />
    </View>
  );
};

export default InputFields;