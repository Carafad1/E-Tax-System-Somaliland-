import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { AdminHeader } from "../../components/AdminHeader";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import { AppSelect } from "../../components/AppSelect";
import { ErrorMessage } from "../../components/ErrorMessage";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { SuccessMessage } from "../../components/SuccessMessage";
import { COLORS } from "../../constants/colors";
import { CURRENCIES, PAYMENT_METHODS, PAYMENT_STATUSES } from "../../constants/config";
import { extractErrorMessage } from "../../services/api";
import { createPayment, getPayment, updatePayment } from "../../services/paymentService";
import { listTaxTypes } from "../../services/taxTypeService";
import { listCitizens } from "../../services/userService";

const STATUS_OPTIONS = PAYMENT_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));

export function AdminPaymentFormScreen({ route, navigation }) {
  const paymentId = route.params?.paymentId;
  const isEdit = !!paymentId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState({});

  const [taxTypes, setTaxTypes] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [existingPayment, setExistingPayment] = useState(null);

  const [form, setForm] = useState({
    user_id: null,
    tax_type_id: null,
    amount: "",
    currency: "SLSH",
    payment_method: "BANK",
    status: "completed",
    notes: "",
  });

  useEffect(() => {
    listTaxTypes(false).then(setTaxTypes).catch(() => {});
    if (!isEdit) {
      listCitizens({ limit: 100 }).then((res) => setCitizens(res.items)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getPayment(paymentId);
        setExistingPayment(data.payment);
        setForm((prev) => ({
          ...prev,
          tax_type_id: data.payment.tax_type_id,
          status: data.payment.status,
          notes: data.payment.notes || "",
        }));
      } catch (err) {
        setError(extractErrorMessage(err, "Unable to load this payment."));
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, paymentId]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSave = async () => {
    if (saving) return;
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      if (isEdit) {
        await updatePayment(paymentId, {
          status: form.status,
          tax_type_id: form.tax_type_id,
          notes: form.notes,
        });
        setSuccess("Payment updated successfully.");
      } else {
        await createPayment({
          user_id: form.user_id,
          tax_type_id: form.tax_type_id,
          amount: parseFloat(form.amount),
          currency: form.currency,
          payment_method: form.payment_method,
          status: form.status,
          notes: form.notes,
        });
        setSuccess("Payment record created successfully.");
        setTimeout(() => navigation.goBack(), 800);
      }
    } catch (err) {
      if (err?.errors) setErrors(err.errors);
      setError(extractErrorMessage(err, "Unable to save this payment."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading payment..." fullScreen />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.white }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AdminHeader title={isEdit ? "Edit Payment" : "Record Payment"} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        {isEdit && existingPayment && (
          <View style={styles.summary}>
            <Text style={styles.summaryText}>Reference: {existingPayment.reference_id}</Text>
            <Text style={styles.summaryText}>Citizen: {existingPayment.citizen_name}</Text>
            <Text style={styles.summaryText}>
              Amount: {existingPayment.amount} {existingPayment.currency}
            </Text>
          </View>
        )}

        {!isEdit && (
          <AppSelect
            label="Citizen"
            value={form.user_id}
            options={citizens.map((c) => ({ value: c.id, label: `${c.full_name} (${c.tin})` }))}
            onSelect={(v) => updateField("user_id", v)}
            error={errors.user_id}
          />
        )}

        <AppSelect
          label="Tax Type"
          value={form.tax_type_id}
          options={taxTypes.map((t) => ({ value: t.id, label: t.name }))}
          onSelect={(v) => updateField("tax_type_id", v)}
          error={errors.tax_type_id}
        />

        {!isEdit && (
          <View>
            <AppInput
              label="Amount"
              value={form.amount}
              onChangeText={(v) => updateField("amount", v)}
              keyboardType="numeric"
              error={errors.amount}
            />
            <AppSelect
              label="Currency"
              value={form.currency}
              options={CURRENCIES}
              onSelect={(v) => updateField("currency", v)}
            />
            <AppSelect
              label="Payment Method"
              value={form.payment_method}
              options={PAYMENT_METHODS}
              onSelect={(v) => updateField("payment_method", v)}
            />
          </View>
        )}

        <AppSelect
          label="Status"
          value={form.status}
          options={STATUS_OPTIONS}
          onSelect={(v) => updateField("status", v)}
        />

        <AppInput
          label="Notes"
          value={form.notes}
          onChangeText={(v) => updateField("notes", v)}
          multiline
          numberOfLines={3}
        />

        <AppButton onPress={handleSave} loading={saving} style={{ marginTop: 8 }}>
          {isEdit ? "Save Changes" : "Record Payment"}
        </AppButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  summary: {
    backgroundColor: COLORS.primaryGreenLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 12,
    color: COLORS.primaryGreenDark,
    marginBottom: 2,
  },
});
