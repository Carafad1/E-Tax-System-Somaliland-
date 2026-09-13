import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";

import { AppButton } from "../../components/AppButton";
import { AppHeader } from "../../components/AppHeader";
import { AppInput } from "../../components/AppInput";
import { AppSelect } from "../../components/AppSelect";
import { ErrorMessage } from "../../components/ErrorMessage";
import { SuccessMessage } from "../../components/SuccessMessage";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { extractErrorMessage } from "../../services/api";
import { listCities } from "../../services/cityService";
import { updateProfile } from "../../services/profileService";

export function EditProfileScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    address: user?.address || "",
    occupation: user?.occupation || "",
    business_name: user?.business_name || "",
    city_id: user?.city_id || null,
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listCities(true).then((items) => {
      if (items && items.length > 0) setCities(items);
    }).catch(() => {});
  }, []);

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
      const data = await updateProfile(form);
      refreshUser(data.user);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      if (err?.errors) setErrors(err.errors);
      setError(extractErrorMessage(err, "Unable to update your profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.white }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AppHeader title="Edit Profile" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <AppInput
          label="Full Name"
          value={form.full_name}
          onChangeText={(v) => updateField("full_name", v)}
          error={errors.full_name}
        />
        <AppSelect
          label="City"
          value={form.city_id}
          options={cities.map((c) => ({ value: c.id, label: c.name }))}
          onSelect={(v) => updateField("city_id", v)}
          error={errors.city_id}
        />
        <AppInput
          label="Address"
          value={form.address}
          onChangeText={(v) => updateField("address", v)}
          error={errors.address}
        />
        <AppInput
          label="Occupation"
          value={form.occupation}
          onChangeText={(v) => updateField("occupation", v)}
          error={errors.occupation}
        />
        {user?.taxpayer_type === "business" && (
          <AppInput
            label="Business Name"
            value={form.business_name}
            onChangeText={(v) => updateField("business_name", v)}
            error={errors.business_name}
          />
        )}

        <AppButton onPress={handleSave} loading={saving} style={{ marginTop: 8 }}>
          Save Changes
        </AppButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
});
