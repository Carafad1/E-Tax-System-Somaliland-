import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { HelperText, Text, TextInput } from "react-native-paper";

import { COLORS } from "../constants/colors";

export function AppSelect({ label, value, options, onSelect, error, placeholder = "Select an option" }) {
  const [visible, setVisible] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={{ marginBottom: 14 }}>
      <Pressable onPress={() => setVisible(true)}>
        <View pointerEvents="none">
          <TextInput
            mode="outlined"
            label={label}
            value={selectedOption ? selectedOption.label : ""}
            placeholder={placeholder}
            editable={false}
            error={!!error}
            right={<TextInput.Icon icon="chevron-down" />}
          />
        </View>
      </Pressable>
      {!!error && <HelperText type="error">{error}</HelperText>}

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <View style={styles.sheet}>
            <Text variant="titleMedium" style={styles.sheetTitle}>
              {label}
            </Text>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, item.value === value && styles.optionSelected]}
                  onPress={() => {
                    onSelect(item.value);
                    setVisible(false);
                  }}
                >
                  <Text style={item.value === value ? styles.optionTextSelected : styles.optionText}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={{ padding: 16, color: COLORS.textSecondary }}>No options available.</Text>
              }
            />
          </View>
        </Pressable>
      </Modal>
    </View>
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
    paddingBottom: 24,
    maxHeight: "70%",
  },
  sheetTitle: {
    padding: 16,
    fontWeight: "700",
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionSelected: {
    backgroundColor: COLORS.primaryGreenLight,
  },
  optionText: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  optionTextSelected: {
    color: COLORS.primaryGreen,
    fontSize: 16,
    fontWeight: "700",
  },
});
