import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";

import { AdminHeader } from "../../components/AdminHeader";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import { AppSelect } from "../../components/AppSelect";
import { ErrorMessage } from "../../components/ErrorMessage";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { SuccessMessage } from "../../components/SuccessMessage";
import { COLORS } from "../../constants/colors";
import { TAXPAYER_TYPES } from "../../constants/config";
import { extractErrorMessage } from "../../services/api";
import { listCities } from "../../services/cityService";
import { createCitizen, getCitizen, updateCitizen } from "../../services/userService";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

export function AdminCitizenFormScreen({ route, navigation }) {
  const citizenId = route.params?.citizenId;
  const isEdit = !!citizenId;

  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    id_number: "",
    city_id: null,
    address: "",
    occupation: "",
    taxpayer_type: "individual",
    business_name: "",
    status: "active",
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    listCities(true).then(setCities).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getCitizen(citizenId);
        setForm({
          full_name: data.user.full_name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          id_number: data.user.id_number || "",
          city_id: data.user.city_id,
          address: data.user.address || "",
          occupation: data.user.occupation || "",
          taxpayer_type: data.user.taxpayer_type || "individual",
          business_name: data.user.business_name || "",
          status: data.user.status || "active",
        });
      } catch (err) {
        setError(extractErrorMessage(err, "Unable to load this citizen."));
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, citizenId]);

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
        await updateCitizen(citizenId, form);
        setSuccess("Citizen updated successfully.");
      } else {
        const created = await createCitizen(form);
        if (created?.generated_password) {
          setSuccess(
            `Citizen created successfully. Temporary login password: ${created.generated_password} (share this with the citizen; they can change it after logging in).`
          );
        } else {
          setSuccess("Citizen created successfully.");
          setTimeout(() => navigation.goBack(), 800);
        }
      }
    } catch (err) {
      if (err?.errors) setErrors(err.errors);
      setError(extractErrorMessage(err, "Unable to save this citizen."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading citizen..." fullScreen />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.white }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AdminHeader title={isEdit ? "Edit Citizen" : "Create Citizen"} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <AppInput
          label="Full Name"
          value={form.full_name}
          onChangeText={(v) => updateField("full_name", v)}
          error={errors.full_name}
        />
        <AppInput
          label="Email"
          value={form.email}
          onChangeText={(v) => updateField("email", v)}
          autoCapitalize="none"
          error={errors.email}
        />
        <AppInput
          label="Phone"
          value={form.phone}
          onChangeText={(v) => updateField("phone", v)}
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <AppInput
          label="ID Number"
          value={form.id_number}
          onChangeText={(v) => updateField("id_number", v)}
          error={errors.id_number}
        />
        <AppSelect
          label="City"
          value={form.city_id}
          options={cities.map((c) => ({ value: c.id, label: c.name }))}
          onSelect={(v) => updateField("city_id", v)}
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
        <AppSelect
          label="Taxpayer Type"
          value={form.taxpayer_type}
          options={TAXPAYER_TYPES}
          onSelect={(v) => updateField("taxpayer_type", v)}
        />
        {form.taxpayer_type === "business" && (
          <AppInput
            label="Business Name"
            value={form.business_name}
            onChangeText={(v) => updateField("business_name", v)}
            error={errors.business_name}
          />
        )}
        {isEdit && (
          <AppSelect
            label="Status"
            value={form.status}
            options={STATUS_OPTIONS}
            onSelect={(v) => updateField("status", v)}
          />
        )}

        <AppButton onPress={handleSave} loading={saving} style={{ marginTop: 8 }}>
          {isEdit ? "Save Changes" : "Create Citizen"}
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
