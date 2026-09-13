import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";

import { AdminHeader } from "../../components/AdminHeader";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import { AppSelect } from "../../components/AppSelect";
import { ErrorMessage } from "../../components/ErrorMessage";
import { SuccessMessage } from "../../components/SuccessMessage";
import { COLORS } from "../../constants/colors";
import { extractErrorMessage } from "../../services/api";
import { createTaxType, listTaxTypes, updateTaxType } from "../../services/taxTypeService";

const FREQUENCIES = [
  { value: "daily", label: "Maalinle (Daily)" },
  { value: "semi_annual", label: "Lix-biloodle (Semi-Annual)" },
  { value: "yearly", label: "Sanadle (Yearly)" },
];

export function AdminTaxTypeFormScreen({ route, navigation }) {
  const taxTypeId = route.params?.taxTypeId;
  const isEdit = !!taxTypeId;

  const [form, setForm] = useState({
    name: "",
    description: "",
    frequency: "yearly",
    min_amount_slsh: "",
    min_amount_usd: "",
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    listTaxTypes(false).then((items) => {
      const existing = items.find((t) => t.id === taxTypeId);
      if (existing) {
        setForm({
          name: existing.name,
          description: existing.description || "",
          frequency: existing.frequency,
          min_amount_slsh: String(existing.min_amount_slsh),
          min_amount_usd: String(existing.min_amount_usd),
        });
      }
    });
  }, [isEdit, taxTypeId]);

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
      const payload = {
        ...form,
        min_amount_slsh: parseFloat(form.min_amount_slsh),
        min_amount_usd: parseFloat(form.min_amount_usd),
      };
      if (isEdit) {
        await updateTaxType(taxTypeId, payload);
        setSuccess("Tax type updated successfully.");
      } else {
        await createTaxType(payload);
        setSuccess("Tax type created successfully.");
        setTimeout(() => navigation.goBack(), 800);
      }
    } catch (err) {
      if (err?.errors) setErrors(err.errors);
      setError(extractErrorMessage(err, "Unable to save this tax type."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.white }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AdminHeader title={isEdit ? "Edit Tax Type" : "Create Tax Type"} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <AppInput label="Name" value={form.name} onChangeText={(v) => updateField("name", v)} error={errors.name} />
        <AppInput
          label="Description"
          value={form.description}
          onChangeText={(v) => updateField("description", v)}
          multiline
          numberOfLines={2}
        />
        <AppSelect
          label="Frequency"
          value={form.frequency}
          options={FREQUENCIES}
          onSelect={(v) => updateField("frequency", v)}
        />
        <AppInput
          label="Minimum Amount (SLSH)"
          value={form.min_amount_slsh}
          onChangeText={(v) => updateField("min_amount_slsh", v)}
          keyboardType="numeric"
          error={errors.min_amount_slsh}
        />
        <AppInput
          label="Minimum Amount (USD)"
          value={form.min_amount_usd}
          onChangeText={(v) => updateField("min_amount_usd", v)}
          keyboardType="numeric"
          error={errors.min_amount_usd}
        />

        <AppButton onPress={handleSave} loading={saving} style={{ marginTop: 8 }}>
          {isEdit ? "Save Changes" : "Create Tax Type"}
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
