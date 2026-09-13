import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Divider, Icon, Text } from "react-native-paper";

import { AppButton } from "../../components/AppButton";
import { AppHeader } from "../../components/AppHeader";
import { AppInput } from "../../components/AppInput";
import { ErrorMessage } from "../../components/ErrorMessage";
import { COLORS } from "../../constants/colors";
import { extractErrorMessage } from "../../services/api";
import { verifyReceipt } from "../../services/receiptService";
import { formatAmount, formatDate, formatFrequencyLabel } from "../../utils/formatters";

export function VerifyReceiptScreen({ route, navigation }) {
  const prefilled = route?.params?.referenceId || "";
  const [reference, setReference] = useState(prefilled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleVerify = async (ref) => {
    const value = (ref ?? reference).trim();
    if (!value) {
      setError("Please enter a receipt reference.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await verifyReceipt(value);
      setResult(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Receipt not found. Please check the reference and try again."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prefilled) {
      handleVerify(prefilled);
    }
  }, [prefilled]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Verify Digital Receipt" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <AppButton
          mode="outlined"
          icon="qrcode-scan"
          style={{ marginBottom: 16 }}
          onPress={() => navigation.navigate("QRScanner")}
        >
          Scan QR Code
        </AppButton>

        <Text style={styles.orText}>or enter the receipt reference manually</Text>

        <AppInput
          label="Receipt Reference"
          value={reference}
          onChangeText={setReference}
          autoCapitalize="characters"
          placeholder="ETX-2026-000001"
        />

        <ErrorMessage message={error} />

        <AppButton loading={loading} onPress={() => handleVerify()}>
          Verify
        </AppButton>

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.verifiedRow}>
              <Icon source="check-decagram" size={22} color={COLORS.success} />
              <Text style={styles.verifiedText}>Receipt VERIFIED</Text>
            </View>
            <Divider style={{ marginVertical: 12 }} />
            <Row label="Receipt Number" value={result.receipt_number} />
            <Row label="Taxpayer" value={result.taxpayer} />
            <Row label="Tax Type" value={result.tax_type} />
            <Row label="Frequency" value={formatFrequencyLabel(result.tax_type_frequency)} />
            <Row label="Amount" value={formatAmount(result.amount, result.currency)} />
            <Row label="Payment Date" value={formatDate(result.payment_date)} />
            <Row label="Status" value={(result.status || "").toUpperCase()} last />
          </View>
        )}
      </ScrollView>
    </View>
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
    padding: 20,
  },
  orText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 14,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  verifiedText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.success,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  rowLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  rowValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
});
