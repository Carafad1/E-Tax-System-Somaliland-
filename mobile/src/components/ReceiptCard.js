import { StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import { COLORS } from "../constants/colors";
import { formatAmount, formatDate } from "../utils/formatters";
import { AppCard } from "./AppCard";

export function ReceiptCard({ receipt, onPress }) {
  return (
    <AppCard onPress={onPress}>
      <View style={styles.row}>
        <Icon source="file-document-outline" size={20} color={COLORS.primaryGreen} />
        <Text style={styles.number}>{receipt.receipt_number}</Text>
      </View>
      <Text style={styles.taxType}>{receipt.tax_type}</Text>
      <Text style={styles.amount}>{formatAmount(receipt.amount, receipt.currency)}</Text>
      <Text style={styles.date}>{formatDate(receipt.payment_date || receipt.created_at)}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  number: {
    fontWeight: "700",
  },
  taxType: {
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  amount: {
    fontWeight: "700",
    fontSize: 15,
  },
  date: {
    marginTop: 4,
    fontSize: 12,
    color: "#9CA3AF",
  },
});
