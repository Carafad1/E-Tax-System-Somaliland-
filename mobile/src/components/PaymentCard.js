import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { STATUS_COLORS } from "../constants/colors";
import { formatAmount, formatDate, formatPaymentMethodLabel, formatStatusLabel } from "../utils/formatters";
import { AppCard } from "./AppCard";

export function PaymentCard({ payment, onPress }) {
  const statusColor = STATUS_COLORS[payment.status] || STATUS_COLORS.pending;

  return (
    <AppCard onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.reference}>{payment.reference_id}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.badgeText, { color: statusColor.text }]}>
            {formatStatusLabel(payment.status)}
          </Text>
        </View>
      </View>
      <Text style={styles.taxType}>{payment.tax_type}</Text>
      <View style={styles.row}>
        <Text style={styles.amount}>{formatAmount(payment.amount, payment.currency)}</Text>
        <Text style={styles.method}>{formatPaymentMethodLabel(payment.payment_method)}</Text>
      </View>
      <Text style={styles.date}>{formatDate(payment.created_at)}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reference: {
    fontWeight: "700",
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  taxType: {
    color: "#6B7280",
    marginBottom: 6,
  },
  amount: {
    fontWeight: "700",
    fontSize: 15,
  },
  method: {
    color: "#6B7280",
    fontSize: 13,
  },
  date: {
    marginTop: 4,
    fontSize: 12,
    color: "#9CA3AF",
  },
});
