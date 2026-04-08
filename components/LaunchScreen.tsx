import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet } from "react-native";

type LaunchScreenProps = {
  visible: boolean;
};

export default function LaunchScreen({ visible }: LaunchScreenProps) {
  const [shouldRender, setShouldRender] = useState(visible);
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      opacity.setValue(1);
      return;
    }

    const animation = Animated.timing(opacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished) {
        setShouldRender(false);
      }
    });

    return () => {
      animation.stop();
    };
  }, [opacity, visible]);

  if (!shouldRender) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.container, { opacity }]}>
      <Image
        source={require("../assets/images/splash.png")}
        style={styles.image}
        contentFit="cover"
        transition={0}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    zIndex: 999,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
