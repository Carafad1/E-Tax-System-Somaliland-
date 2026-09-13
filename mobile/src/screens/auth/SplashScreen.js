import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { APP_NAME, APP_SUBTITLE } from "../../constants/config";
import { COLORS } from "../../constants/colors";

export function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="splashGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={COLORS.primaryDark} />
            <Stop offset="1" stopColor="#040B18" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#splashGrad)" />
      </Svg>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: "center" }}>
        <View style={styles.badgeWrap}>
          <Animated.Image
            source={require("../../../assets/icon.png")}
            style={styles.appIconImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.subtitle}>{APP_SUBTITLE}</Text>
      </Animated.View>
      <View style={styles.loaderWrap}>
        <ActivityIndicator animating size="small" color={COLORS.white} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  badgeWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  appIconImage: {
    width: 140,
    height: 140,
    borderRadius: 24,
  },
  glowRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  glowRingOuter: {
    width: 148,
    height: 148,
  },
  glowRingInner: {
    width: 120,
    height: 120,
  },
  badgeCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  flagClip: {
    borderRadius: 10,
    overflow: "hidden",
  },
  crest: {
    position: "absolute",
    top: 22,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F5C242",
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.white,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 6,
    textAlign: "center",
  },
  loaderWrap: {
    position: "absolute",
    bottom: 56,
  },
});
