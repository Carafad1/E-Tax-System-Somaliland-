import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import { AppSelect } from "../../components/AppSelect";
import { ErrorMessage } from "../../components/ErrorMessage";
import { COLORS } from "../../constants/colors";
import { BUSINESS_TYPES, TAXPAYER_TYPES } from "../../constants/config";
import { useAuth } from "../../hooks/useAuth";
import { extractErrorMessage } from "../../services/api";
import { listCities } from "../../services/cityService";
import { getCache, setCache } from "../../storage/cacheStorage";
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from "../../utils/validators";

const initialForm = {
  full_name: "",
  email: "",
  phone: "",
  id_number: "",
  city_id: null,
  address: "",
  occupation: "",
  taxpayer_type: "individual",
  business_name: "",
  business_type: null,
  password: "",
  confirm_password: "",
};

export function RegisterScreen({ navigation }) {
  const { registerCitizen } = useAuth();
  const scrollRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const items = await listCities(true);
        if (items && items.length > 0) {
          setCities(items);
          setCache("cities", items);
        }
      } catch (_err) {
        // Real data only - fall back to the last real list this device
        // fetched, never a hardcoded/guessed one. Empty stays empty if
        // there is no cache yet; the form's own validation requires a
        // city selection, so this can't silently submit a wrong city.
        const cached = await getCache("cities");
        if (cached && cached.length > 0) setCities(cached);
      }
    })();
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateForm = () => {
    const errors = {};
    const nameErr = validateFullName(form.full_name);
    if (nameErr) errors.full_name = nameErr;

    const phoneErr = validatePhone(form.phone);
    if (phoneErr) errors.phone = phoneErr;

    const emailErr = validateEmail(form.email);
    if (emailErr) errors.email = emailErr;

    const passErr = validatePassword(form.password);
    if (passErr) errors.password = passErr;
    else if (form.password !== form.confirm_password) {
      errors.confirm_password = "Passwords do not match.";
    }

    if (form.taxpayer_type === "business" && !form.business_name.trim()) {
      errors.business_name = "Business name is required for business taxpayers.";
    }

    return errors;
  };

  const handleSubmit = async () => {
    if (loading) return;
    setFormError("");

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setLoading(true);
    try {
      await registerCitizen(form);
    } catch (err) {
      if (err?.errors && Object.keys(err.errors).length > 0) {
        setFieldErrors(err.errors);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
      setFormError(extractErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.white }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView ref={scrollRef} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Register as a taxpayer with E-Tax Somaliland</Text>

        <ErrorMessage message={formError} />

        <AppInput
          label="Full Name"
          value={form.full_name}
          onChangeText={(v) => updateField("full_name", v)}
          error={fieldErrors.full_name}
        />
        <AppInput
          label="Email (optional)"
          value={form.email}
          onChangeText={(v) => updateField("email", v)}
          autoCapitalize="none"
          keyboardType="email-address"
          error={fieldErrors.email}
        />
        <AppInput
          label="Phone Number"
          value={form.phone}
          onChangeText={(v) => updateField("phone", v)}
          keyboardType="phone-pad"
          error={fieldErrors.phone}
        />
        <AppInput
          label="ID Number (optional)"
          value={form.id_number}
          onChangeText={(v) => updateField("id_number", v)}
          error={fieldErrors.id_number}
        />
        <AppSelect
          label="City"
          value={form.city_id}
          options={cities.map((c) => ({ value: c.id, label: c.name }))}
          onSelect={(v) => updateField("city_id", v)}
          error={fieldErrors.city_id}
        />
        <AppInput
          label="Address (optional)"
          value={form.address}
          onChangeText={(v) => updateField("address", v)}
          error={fieldErrors.address}
        />
        <AppInput
          label="Occupation (optional)"
          value={form.occupation}
          onChangeText={(v) => updateField("occupation", v)}
          error={fieldErrors.occupation}
        />
        <AppSelect
          label="Taxpayer Type"
          value={form.taxpayer_type}
          options={TAXPAYER_TYPES}
          onSelect={(v) => updateField("taxpayer_type", v)}
          error={fieldErrors.taxpayer_type}
        />

        {form.taxpayer_type === "business" && (
          <View>
            <AppInput
              label="Business Name"
              value={form.business_name}
              onChangeText={(v) => updateField("business_name", v)}
              error={fieldErrors.business_name}
            />
            <AppSelect
              label="Business Type"
              value={form.business_type}
              options={BUSINESS_TYPES}
              onSelect={(v) => updateField("business_type", v)}
              error={fieldErrors.business_type}
            />
          </View>
        )}

        <AppInput
          label="Password (4 digits)"
          value={form.password}
          onChangeText={(v) => updateField("password", v.replace(/\D/g, "").slice(0, 4))}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          error={fieldErrors.password}
        />
        <AppInput
          label="Confirm Password"
          value={form.confirm_password}
          onChangeText={(v) => updateField("confirm_password", v.replace(/\D/g, "").slice(0, 4))}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          error={fieldErrors.confirm_password}
        />

        <AppButton onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }}>
          Create Account
        </AppButton>

        <View style={styles.footerRow}>
          <Text>Already have an account? </Text>
          <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
            Login
          </Text>
        </View>

        <View style={{ marginBottom: 20 }}>
          <AppButton
            mode="outlined"
            icon="shield-account"
            textColor={COLORS.primary}
            onPress={() => navigation.navigate("AdminLogin")}
          >
            Admin Dashboard Login
          </AppButton>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  link: {
    color: COLORS.primaryGreen,
    fontWeight: "700",
  },
});
