import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import { AppSelect } from "../../components/AppSelect";
import { ErrorMessage } from "../../components/ErrorMessage";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { SandboxNotice } from "../../components/SandboxNotice";
import { COLORS } from "../../constants/colors";
import { CURRENCIES, PAYMENT_METHODS } from "../../constants/config";
import { useAuth } from "../../hooks/useAuth";
import { extractErrorMessage } from "../../services/api";
import { listTaxTypes } from "../../services/taxTypeService";
import { getCache, setCache } from "../../storage/cacheStorage";
import { formatAmount, formatFrequencyLabel } from "../../utils/formatters";

export function PayTaxScreen({ navigation, route }) {
  const { user } = useAuth();
  const [taxTypes, setTaxTypes] = useState([]);
  const [loadingTaxTypes, setLoadingTaxTypes] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [taxTypeId, setTaxTypeId] = useState(route.params?.taxTypeId || null);
  const [currency, setCurrency] = useState("SLSH");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [errors, setErrors] = useState({});

  const loadTaxTypes = useCallback(async () => {
    setLoadingTaxTypes(true);
    setLoadError("");
    try {
      const items = await listTaxTypes(true);
      setTaxTypes(items);
      setCache("tax_types", items);
    } catch (err) {
      const cached = await getCache("tax_types");
      if (cached) {
        setTaxTypes(cached);
      } else {
        setLoadError(extractErrorMessage(err, "Unable to load tax types."));
      }
    } finally {
      setLoadingTaxTypes(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!user?.has_payment_pin) {
        navigation.replace("SetPaymentPin", { returnTo: "PayTax" });
      }
    }, [user])
  );

  useEffect(() => {
    loadTaxTypes();
  }, [loadTaxTypes]);

  const selectedTaxType = taxTypes.find((t) => t.id === taxTypeId);
  const minimumForCurrency = selectedTaxType
    ? currency === "USD"
      ? selectedTaxType.min_amount_usd
      : selectedTaxType.min_amount_slsh
    : null;
  const numericAmount = parseFloat(amount);
  const isBelowMinimum =
    !!selectedTaxType && amount !== "" && !Number.isNaN(numericAmount) && numericAmount < minimumForCurrency;
  const canContinue =
    !!taxTypeId && !!paymentMethod && amount !== "" && !Number.isNaN(numericAmount) && numericAmount > 0 && !isBelowMinimum;

  const handleContinue = () => {
    const newErrors = {};
    if (!taxTypeId) newErrors.tax_type_id = "Please select a tax type.";

    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = "Please enter the correct tax amount required.";
    } else if (isBelowMinimum) {
      newErrors.amount = "Amount-ka aad gelisay wuxuu ka yar yahay minimum-ka loo baahan yahay.";
    }

    if (!paymentMethod) newErrors.payment_method = "Please select a payment method.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    navigation.navigate("PaymentReview", {
      payment: {
        tax_type_id: taxTypeId,
        tax_type_name: selectedTaxType?.name,
        tax_type_frequency: selectedTaxType?.frequency || "yearly",
        currency,
        amount: numericAmount,
        payment_method: paymentMethod,
      },
    });
  };

  if (loadingTaxTypes) {
    return <LoadingSpinner label="Loading tax types..." fullScreen />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Pay Tax</Text>

        <SandboxNotice />

        <ErrorMessage message={loadError} />

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Citizen</Text>
          <Text style={styles.summaryValue}>{user?.full_name}</Text>
          {user?.business_name ? (
            <>
              <Text style={[styles.summaryLabel, { marginTop: 8 }]}>Business</Text>
              <Text style={styles.summaryValue}>
                {user.business_name} {user.business_type ? `(${user.business_type})` : ""}
              </Text>
            </>
          ) : null}
        </View>

        <AppSelect
          label="Tax Type"
          value={taxTypeId}
          options={taxTypes.map((t) => ({ value: t.id, label: t.name }))}
          onSelect={setTaxTypeId}
          error={errors.tax_type_id}
        />
        <AppSelect
          label="Currency"
          value={currency}
          options={CURRENCIES}
          onSelect={setCurrency}
          error={errors.currency}
        />
        {selectedTaxType ? (
          <Text style={styles.hint}>
            Minimum: {formatAmount(minimumForCurrency, currency)} ({formatFrequencyLabel(selectedTaxType.frequency)})
          </Text>
        ) : null}

        <AppInput
          label="Amount"
          value={amount}
          onChangeText={(v) => {
            setAmount(v);
            setErrors((prev) => ({ ...prev, amount: undefined }));
          }}
          keyboardType="numeric"
          error={errors.amount || (isBelowMinimum ? "Amount-ka aad gelisay wuxuu ka yar yahay minimum-ka loo baahan yahay." : undefined)}
        />

        <AppSelect
          label="Payment Method"
          value={paymentMethod}
          options={PAYMENT_METHODS}
          onSelect={setPaymentMethod}
          error={errors.payment_method}
        />

        <AppButton onPress={handleContinue} disabled={!canContinue} style={{ marginTop: 12 }}>
          Continue to Review
        </AppButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: -8,
    marginBottom: 14,
  },
});
