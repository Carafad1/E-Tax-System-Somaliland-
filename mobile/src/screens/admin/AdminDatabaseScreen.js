import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import { AdminHeader } from "../../components/AdminHeader";
import { COLORS } from "../../constants/colors";

const SECTIONS = [
  { label: "Citizens", icon: "account-group-outline", drawer: "AdminCitizensStack" },
  { label: "Payments", icon: "cash-multiple", drawer: "AdminPaymentsStack" },
  { label: "Tax Types", icon: "file-percent-outline", drawer: "AdminTaxTypesStack" },
  { label: "Cities", icon: "city-variant-outline", drawer: "AdminCitiesStack" },
  { label: "Receipts", icon: "receipt", drawer: "AdminReceiptsStack" },
  { label: "Audit Logs", icon: "shield-search", drawer: "AdminAuditLogsStack" },
];

export function AdminDatabaseScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AdminHeader title="Database Management" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.intro}>
          Manage every database record directly through the app - no manual MySQL access is
          required for normal operations.
        </Text>
        {SECTIONS.map((section) => (
          <Pressable
            key={section.label}
            style={styles.item}
            onPress={() => (navigation.getParent() || navigation).navigate(section.drawer)}
          >
            <Icon source={section.icon} size={22} color={COLORS.primaryGreen} />
            <Text style={styles.itemLabel}>{section.label}</Text>
            <Icon source="chevron-right" size={18} color={COLORS.gray} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  intro: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
});
