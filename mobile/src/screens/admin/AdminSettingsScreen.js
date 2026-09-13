import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Divider, Icon, Text } from "react-native-paper";

import { AdminHeader } from "../../components/AdminHeader";
import { SomalilandFlag } from "../../components/SomalilandFlag";
import { COLORS } from "../../constants/colors";
import { APP_NAME } from "../../constants/config";
import { useAuth } from "../../hooks/useAuth";

export function AdminSettingsScreen() {
  const { admin, logout } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AdminHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <SomalilandFlag width={72} height={48} />
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.adminName}>{admin?.full_name || admin?.username}</Text>
          <Text style={styles.role}>Administrator</Text>
        </View>

        <View style={styles.card}>
          <Row label="Username" value={admin?.username} />
          <Row label="Role" value={admin?.role} last />
        </View>

        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Icon source="logout" size={18} color={COLORS.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, last }) {
  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      {!last && <Divider />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  appName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 10,
  },
  adminName: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  role: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
  },
  rowLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  rowValue: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textTransform: "capitalize",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.dangerLight,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  logoutText: {
    color: COLORS.danger,
    fontWeight: "700",
  },
});
