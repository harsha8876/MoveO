import { useState } from "react";
import { Image, Text, View } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";

const googlePlacesApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY?.trim();

const GoogleTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  onFocusChange,
  handlePress,
}: GoogleInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const hasApiKey = Boolean(googlePlacesApiKey);

  return (
    <View className={`relative rounded-xl ${containerStyle}`}>
      <GooglePlacesAutocomplete
        fetchDetails={true}
        placeholder="Search"
        debounce={200}
        minLength={2}
        enablePoweredByContainer={false}
        keyboardShouldPersistTaps="always"
        keepResultsAfterBlur={true}
        listViewDisplayed={isFocused ? "auto" : false}
        onFail={(error) => {
          setSearchFeedback(
            error || "Search could not load. Check your Google Places setup.",
          );
        }}
        onNotFound={() => {
          setSearchFeedback("No places matched that search.");
        }}
        styles={{
          container: {
            flex: 0,
            width: "100%",
            zIndex: isFocused ? 5000 : 1,
            elevation: isFocused ? 20 : 1,
          },
          textInputContainer: {
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 20,
            position: "relative",
            width: "100%",
            shadowColor: "#d4d4d4",
          },
          textInput: {
            backgroundColor: textInputBackgroundColor
              ? textInputBackgroundColor
              : "white",
            fontSize: 16,
            fontWeight: "600",
            marginTop: 5,
            width: "100%",
            borderRadius: 200,
            minHeight: 50,
          },
          listView: {
            backgroundColor: textInputBackgroundColor || "#D6D6E0",
            position: "absolute",
            top: 58,
            left: 0,
            right: 0,
            borderRadius: 12,
            zIndex: 6000,
            elevation: 24,
            maxHeight: 240,
            borderWidth: 1,
            borderColor: "#B9B9C7",
          },
          row: {
            backgroundColor: textInputBackgroundColor || "#D6D6E0",
            paddingVertical: 12,
            paddingHorizontal: 16,
          },
          description: {
            color: "#2F2F42",
            fontSize: 14,
            fontWeight: "600",
          },
          separator: {
            height: 1,
            backgroundColor: "#B9B9C7",
          },
        }}
        onPress={(data, details = null) => {
          setSearchFeedback(null);
          handlePress({
            latitude: details?.geometry.location.lat!,
            longitude: details?.geometry.location.lng!,
            address: data.description,
          });
        }}
        query={{
          key: googlePlacesApiKey ?? "",
          language: "en",
        }}
        renderLeftButton={() => (
          <View className="justify-center items-center w-6 h-6">
            <Image
              source={icon ? icon : icons.search}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </View>
        )}
        textInputProps={{
          placeholderTextColor: "gray",
          placeholder: initialLocation ?? "Where do you want to go?",
          onFocus: () => {
            setIsFocused(true);
            onFocusChange?.(true);

            if (hasApiKey) {
              setSearchFeedback(null);
            }
          },
          onBlur: () => {
            setIsFocused(false);
            onFocusChange?.(false);
          },
        }}
      />

      {!hasApiKey ? (
        <Text className="mt-3 text-sm text-[#B42318] font-JakartaMedium">
          Add `EXPO_PUBLIC_GOOGLE_API_KEY` to load search suggestions.
        </Text>
      ) : searchFeedback ? (
        <Text className="mt-3 text-sm text-[#747490] font-JakartaMedium">
          {searchFeedback}
        </Text>
      ) : null}
    </View>
  );
};

export default GoogleTextInput;
