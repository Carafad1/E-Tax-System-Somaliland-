import { StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import { COLORS } from "../constants/colors";
import { AppButton } from "./AppButton";

export function ErrorState({
  title = "Something went wrong",
  message = "Please try again.",
  onRetry,
  retryLabel = "Retry",
  onSecondaryAction,
  secondaryLabel,
}) {
  return (
    <View style={styles.container}>
      <Icon source="wifi-off" size={48} color={COLORS.danger} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        {!!onRetry && (
          <AppButton style={{ marginTop: 16, marginRight: onSecondaryAction ? 8 : 0 }} onPress={onRetry}>
            {retryLabel}
          </AppButton>
        )}
        {!!onSecondaryAction && (
          <AppButton mode="outlined" style={{ marginTop: 16 }} onPress={onSecondaryAction}>
            {secondaryLabel}
          </AppButton>
        )}
      </View>
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
  actions: {
    flexDirection: "row",
  },
});
