import { StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import { COLORS } from "../constants/colors";

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <View style={styles.container}>
      <Icon source="alert-circle-outline" size={18} color={COLORS.danger} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.dangerLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  text: {
    color: COLORS.danger,
    flex: 1,
    flexWrap: "wrap",
  },
});
