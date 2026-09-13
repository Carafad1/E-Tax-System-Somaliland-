import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { COLORS } from "../constants/colors";
import { AppButton } from "./AppButton";
import { AppSelect } from "./AppSelect";

/**
 * fields: [{ key, label, options: [{value,label}] }]
 */
export function FilterPanel({ visible, fields, values, onChange, onApply, onClear, onClose }) {
  const [localValues, setLocalValues] = useState(values || {});

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text variant="titleMedium" style={styles.title}>
            Filters
          </Text>
          <ScrollView style={{ maxHeight: 400 }}>
            {fields.map((field) => (
              <AppSelect
                key={field.key}
                label={field.label}
                value={localValues[field.key]}
                options={field.options}
                onSelect={(val) => setLocalValues((prev) => ({ ...prev, [field.key]: val }))}
              />
            ))}
          </ScrollView>
          <View style={styles.actions}>
            <AppButton
              mode="outlined"
              style={{ flex: 1, marginRight: 8 }}
              onPress={() => {
                setLocalValues({});
                onClear();
              }}
            >
              Clear
            </AppButton>
            <AppButton
              style={{ flex: 1 }}
              onPress={() => {
                onChange(localValues);
                onApply(localValues);
              }}
            >
              Apply
            </AppButton>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#00000055",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  title: {
    fontWeight: "700",
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    marginTop: 8,
  },
});
