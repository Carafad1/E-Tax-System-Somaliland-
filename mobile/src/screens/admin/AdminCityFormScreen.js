import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";

import { AdminHeader } from "../../components/AdminHeader";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import { ErrorMessage } from "../../components/ErrorMessage";
import { SuccessMessage } from "../../components/SuccessMessage";
import { COLORS } from "../../constants/colors";
import { extractErrorMessage } from "../../services/api";
import { createCity, listCities, updateCity } from "../../services/cityService";

export function AdminCityFormScreen({ route, navigation }) {
  const cityId = route.params?.cityId;
  const isEdit = !!cityId;

  const [form, setForm] = useState({ name: "", region: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    listCities(false).then((items) => {
      const existing = items.find((c) => c.id === cityId);
      if (existing) setForm({ name: existing.name, region: existing.region || "" });
    });
  }, [isEdit, cityId]);

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
        await updateCity(cityId, form);
        setSuccess("City updated successfully.");
      } else {
        await createCity(form);
        setSuccess("City created successfully.");
        setTimeout(() => navigation.goBack(), 800);
      }
    } catch (err) {
      if (err?.errors) setErrors(err.errors);
      setError(extractErrorMessage(err, "Unable to save this city."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.white }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AdminHeader title={isEdit ? "Edit City" : "Create City"} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <AppInput label="City Name" value={form.name} onChangeText={(v) => updateField("name", v)} error={errors.name} />
        <AppInput label="Region" value={form.region} onChangeText={(v) => updateField("region", v)} />

        <AppButton onPress={handleSave} loading={saving} style={{ marginTop: 8 }}>
          {isEdit ? "Save Changes" : "Create City"}
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
});
