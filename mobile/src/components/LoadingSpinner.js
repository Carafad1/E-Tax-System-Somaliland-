import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

import { COLORS } from "../constants/colors";

export function LoadingSpinner({ label = "Loading...", fullScreen = false }) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator animating size="large" color={COLORS.primaryGreen} />
      {!!label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  label: {
    marginTop: 10,
    color: COLORS.textSecondary,
  },
});
