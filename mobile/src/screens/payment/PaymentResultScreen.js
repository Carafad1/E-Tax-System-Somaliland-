import { ScrollView, StyleSheet, View } from "react-native";
import { Divider, Icon, Text } from "react-native-paper";

import { AppButton } from "../../components/AppButton";
import { COLORS } from "../../constants/colors";
import { formatAmount, formatDate, formatFrequencyLabel, formatPaymentMethodLabel } from "../../utils/formatters";

export function PaymentResultScreen({ route, navigation }) {
  const { success, payment, receipt, message } = route.params;

  if (!success) {
    return (
      <View style={styles.centerContainer}>
        <Icon source="close-circle" size={64} color={COLORS.danger} />
        <Text style={styles.failTitle}>Payment could not be completed.</Text>
        {!!message && <Text style={styles.failMessage}>{message}</Text>}
        <AppButton style={{ marginTop: 24, width: "100%" }} onPress={() => navigation.goBack()}>
          Retry
        </AppButton>
        <AppButton
          mode="outlined"
          style={{ marginTop: 10, width: "100%" }}
          onPress={() => navigation.popToTop()}
        >
          Back to Dashboard
        </AppButton>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.iconWrap}>
        <Icon source="check-circle" size={72} color={COLORS.success} />
      </View>
      <Text style={styles.title}>Payment Successful ✓</Text>
      <Text style={styles.message}>
        Citizen, you have successfully fulfilled your tax obligation.
      </Text>

      <View style={styles.card}>
        <Row label="Reference ID" value={payment.reference_id} />
        <Row label="Transaction ID" value={payment.transaction_id} />
        <Row label="Taxpayer ID" value={payment.taxpayer_id} />
        <Row label="Citizen Name" value={payment.citizen_name} />
        {payment.business_name ? <Row label="Business Name" value={payment.business_name} /> : null}
        <Row label="Tax Type" value={payment.tax_type || payment.tax_type_name} />
        <Row label="Frequency" value={formatFrequencyLabel(payment.tax_type_frequency)} />
        <Row label="Payment Method" value={formatPaymentMethodLabel(payment.payment_method)} />
        <Row label="Currency" value={payment.currency} />
        <Row label="Amount" value={formatAmount(payment.amount, payment.currency)} />
        <Row label="Date" value={formatDate(payment.payment_date)} />
        <Row label="Status" value={(payment.status || "").toUpperCase()} last />
      </View>

      <AppButton
        style={{ marginTop: 20 }}
        onPress={() =>
          navigation.replace("ReceiptDetail", {
            referenceId: payment.reference_id,
            preloadedReceipt: payment,
          })
        }
      >
        View Receipt
      </AppButton>
      <AppButton
        mode="outlined"
        style={{ marginTop: 10 }}
        onPress={() =>
          navigation.replace("ReceiptDetail", {
            referenceId: payment.reference_id,
            preloadedReceipt: payment,
          })
        }
      >
        Download PDF
      </AppButton>
      <AppButton mode="text" style={{ marginTop: 4 }} onPress={() => navigation.popToTop()}>
        Back to Dashboard
      </AppButton>
    </ScrollView>
  );
}

function Row({ label, value, last }) {
  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      {!last && <Divider />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: COLORS.background,
  },
  iconWrap: {
    marginTop: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  failTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 16,
    textAlign: "center",
  },
  failMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
  },
  rowLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  rowValue: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    maxWidth: "60%",
    textAlign: "right",
  },
});
