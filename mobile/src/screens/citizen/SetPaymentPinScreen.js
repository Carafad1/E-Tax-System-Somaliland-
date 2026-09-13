import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

import { AppButton } from "../../components/AppButton";
import { AppHeader } from "../../components/AppHeader";
import { AppInput } from "../../components/AppInput";
import { ErrorMessage } from "../../components/ErrorMessage";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { extractErrorMessage } from "../../services/api";
import { setPaymentPin } from "../../services/profileService";
import { validatePin } from "../../utils/validators";

export function SetPaymentPinScreen({ navigation, route }) {
  const { user, refreshUser } = useAuth();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    setError("");

    const pinError = validatePin(pin);
    if (pinError) {
      setError(pinError);
      return;
    }
    if (pin !== confirmPin) {
      setError("PIN confirmation does not match.");
      return;
    }

    setSaving(true);
    try {
      await setPaymentPin(pin, confirmPin);
      refreshUser({ ...user, has_payment_pin: true });

      const returnTo = route.params?.returnTo;
      if (returnTo) {
        navigation.replace(returnTo);
      } else {
        navigation.goBack();
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Unable to set your payment PIN."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.white }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AppHeader title="Payment PIN" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.info}>
          Your payment PIN authorizes tax payments made in this app. Choose a 4 to 6 digit PIN that
          only you know. It is never shown or stored in plain text.
        </Text>

        <ErrorMessage message={error} />

        <AppInput
          label="New PIN"
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          secureTextEntry
          maxLength={6}
        />
        <AppInput
          label="Confirm PIN"
          value={confirmPin}
          onChangeText={setConfirmPin}
          keyboardType="numeric"
          secureTextEntry
          maxLength={6}
        />

        <AppButton onPress={handleSave} loading={saving} style={{ marginTop: 8 }}>
          Save PIN
        </AppButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  info: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 19,
  },
});
