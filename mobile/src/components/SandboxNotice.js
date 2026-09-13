import { StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import { COLORS } from "../constants/colors";

export function SandboxNotice() {
  return (
    <View style={styles.wrap}>
      <Icon source="flask-outline" size={16} color={COLORS.warning} />
      <Text style={styles.text}>DEVELOPMENT MODE — SANDBOX PAYMENT</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.warningLight,
    borderColor: COLORS.warning,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  text: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.warning,
    letterSpacing: 0.3,
  },
});
