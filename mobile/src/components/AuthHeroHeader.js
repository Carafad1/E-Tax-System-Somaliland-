import { Image, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../constants/colors";

export function AuthHeroHeader({ title, subtitle, compact = false }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.hero,
        { paddingTop: insets.top + (compact ? 16 : 28) },
        compact && styles.heroCompact,
      ]}
    >
      <View style={styles.badge}>
        <Image
          source={require("../../assets/icon.png")}
          style={{ width: 56, height: 56, borderRadius: 14 }}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "#062E8A",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 28,
    alignItems: "center",
    paddingHorizontal: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  heroCompact: {
    paddingBottom: 20,
  },
  badge: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.white,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.primaryLight,
    marginTop: 4,
    textAlign: "center",
  },
});
