import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch";
import {
  calculateDriverTimes,
  calculateRegion,
  generateMarkersFromData,
} from "@/lib/map";
import { useDriverStore, useLocationStore } from "@/store";
import { Driver, MarkerData } from "@/types/type";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

type MapProps = {
  latitude?: number | null;
  longitude?: number | null;
};

const Map = () => {
  const { data: drivers, loading, error } = useFetch<Driver[]>("/(api)/driver");
  const mapRef = useRef<MapView>(null);
  const hasFocusedUserLocation = useRef(false);
  const {
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();

  const {
    drivers: storedDrivers,
    selectedDriver,
    setDrivers,
  } = useDriverStore();
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  const getRandomDrivers = (driverList: Driver[]) => {
    const shuffledDrivers = [...driverList].sort(() => Math.random() - 0.5);
    const maxVisibleDrivers = Math.min(10, shuffledDrivers.length);
    const visibleDriverCount = Math.max(
      1,
      Math.floor(Math.random() * maxVisibleDrivers) + 1,
    );

    return shuffledDrivers.slice(0, visibleDriverCount);
  };

  const region = calculateRegion({
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationLongitude,
  });

  useEffect(() => {
    if (!userLatitude || !userLongitude) return;

    if (storedDrivers.length > 0) {
      setMarkers(storedDrivers);
      return;
    }

    if (!Array.isArray(drivers)) return;

    const visibleDrivers = getRandomDrivers(drivers);
    const newMarkers = generateMarkersFromData({
      data: visibleDrivers,
      userLatitude,
      userLongitude,
    });

    setMarkers(newMarkers);
    setDrivers(newMarkers);
  }, [drivers, storedDrivers, userLatitude, userLongitude, setDrivers]);

  useEffect(() => {
    if (
      markers.length > 0 &&
      destinationLatitude != null &&
      destinationLongitude != null
    ) {
      calculateDriverTimes({
        markers,
        userLongitude,
        userLatitude,
        destinationLatitude,
        destinationLongitude,
      }).then((driversWithTimes) => {
        if (driversWithTimes) {
          setMarkers(driversWithTimes as MarkerData[]);
          setDrivers(driversWithTimes as MarkerData[]);
        }
      });
    }
  }, [
    markers,
    destinationLatitude,
    destinationLongitude,
    userLongitude,
    userLatitude,
    setDrivers,
  ]);

  useEffect(() => {
    if (!mapRef.current || !userLatitude || !userLongitude) return;

    if (!hasFocusedUserLocation.current) {
      hasFocusedUserLocation.current = true;
      mapRef.current.animateToRegion(
        {
          latitude: userLatitude,
          longitude: userLongitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        350,
      );
      return;
    }

    mapRef.current.animateToRegion(region, 350);
  }, [region, userLatitude, userLongitude]);

  if (loading || !userLatitude || !userLongitude)
    return (
      <View className="flex justify-between items-center w-full">
        <ActivityIndicator size="small" color="#000" />
      </View>
    );

  if (error)
    return (
      <View className="flex justify-between items-center w-full">
        <Text>Error: {error}</Text>
      </View>
    );

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_DEFAULT}
      className="w-full h-full rounded-2xl"
      style={{ width: "100%", height: "100%" }}
      initialRegion={region}
      showsUserLocation
      tintColor="black"
      mapType="mutedStandard"
      userInterfaceStyle="light"
    >
      {markers?.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          title={marker.title}
          image={
            selectedDriver === +marker.id ? icons.selectedMarker : icons.marker
          }
        />
      ))}
    </MapView>
  );
};

export default Map;
