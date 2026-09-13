import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Divider, Text } from "react-native-paper";

import { AppButton } from "../../components/AppButton";
import { AppHeader } from "../../components/AppHeader";
import { AppInput } from "../../components/AppInput";
import { ErrorMessage } from "../../components/ErrorMessage";
import { SandboxNotice } from "../../components/SandboxNotice";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { extractErrorMessage } from "../../services/api";
import { createPayment } from "../../services/paymentService";
import { formatAmount, formatPaymentMethodLabel } from "../../utils/formatters";
import { validatePin } from "../../utils/validators";

export function PaymentReviewScreen({ route, navigation }) {
  const { payment } = route.params;
  const { user } = useAuth();
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (submitting) return;

    const pinValidationError = validatePin(pin);
    if (pinValidationError) {
      setPinError(pinValidationError);
      return;
    }
    setPinError("");
    setSubmitError("");
    setSubmitting(true);

    try {
      const response = await createPayment({
        tax_type_id: payment.tax_type_id,
        tax_type_name: payment.tax_type_name,
        tax_type_frequency: payment.tax_type_frequency,
        amount: payment.amount,
        currency: payment.currency,
        payment_method: payment.payment_method,
        pin,
      });

      navigation.replace("PaymentResult", {
        success: true,
        payment: response.data.payment,
        receipt: response.data.receipt,
      });
    } catch (err) {
      if (err?.status === 402) {
        navigation.replace("PaymentResult", {
          success: false,
          message: extractErrorMessage(err, "Payment could not be completed."),
        });
        return;
      }
      if (err?.errors?.pin) {
        setPinError(err.errors.pin);
      }
      setSubmitError(extractErrorMessage(err, "Payment could not be completed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AppHeader title="Review Payment" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <SandboxNotice />

        <View style={styles.card}>
          <Row label="Taxpayer" value={user?.full_name} />
          {user?.business_name ? <Row label="Business" value={user.business_name} /> : null}
          <Row label="Tax Type" value={payment.tax_type_name} />
          <Row label="Amount" value={formatAmount(payment.amount, payment.currency)} />
          <Row label="Currency" value={payment.currency} />
          <Row label="Payment Method" value={formatPaymentMethodLabel(payment.payment_method)} last />
        </View>

        <Text style={styles.pinLabel}>Enter your payment PIN to confirm</Text>
        <AppInput
          label="Payment PIN"
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          secureTextEntry
          maxLength={6}
          error={pinError}
        />

        <ErrorMessage message={submitError} />

        <AppButton onPress={handleConfirm} loading={submitting} style={{ marginTop: 8 }}>
          Confirm Payment
        </AppButton>
      </ScrollView>
    </KeyboardAvoidingView>
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  rowLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  rowValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  pinLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
});
