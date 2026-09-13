import { StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import { COLORS } from "../constants/colors";
import { AppButton } from "./AppButton";

export function EmptyState({ icon = "inbox-outline", title = "Nothing here yet", message, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <Icon source={icon} size={48} color={COLORS.gray} />
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {!!actionLabel && (
        <AppButton mode="outlined" style={{ marginTop: 16 }} onPress={onAction}>
          {actionLabel}
        </AppButton>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
});
