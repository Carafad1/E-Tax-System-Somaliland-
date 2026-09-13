import { StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import { COLORS } from "../constants/colors";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export function OfflineBanner() {
  const isOnline = useNetworkStatus();
  if (isOnline) return null;

  return (
    <View style={styles.container}>
      <Icon source="wifi-off" size={16} color={COLORS.white} />
      <Text style={styles.text}>You are currently offline.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.darkGray,
    paddingVertical: 6,
    gap: 6,
  },
  text: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
});
