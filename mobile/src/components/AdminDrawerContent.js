import { StyleSheet, View } from "react-native";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Divider, Icon, Text } from "react-native-paper";

import { COLORS } from "../constants/colors";
import { useAuth } from "../hooks/useAuth";
import { SomalilandFlag } from "./SomalilandFlag";

const ITEMS = [
  { label: "Dashboard", icon: "view-dashboard-outline", route: "AdminDashboardStack" },
  { label: "Taxpayers", icon: "account-group-outline", route: "AdminCitizensStack" },
  { label: "Payments", icon: "cash-multiple", route: "AdminPaymentsStack" },
  { label: "Tax Types", icon: "file-percent-outline", route: "AdminTaxTypesStack" },
  { label: "Cities", icon: "city-variant-outline", route: "AdminCitiesStack" },
  { label: "Receipts", icon: "receipt", route: "AdminReceiptsStack" },
  { label: "Reports", icon: "chart-bar", route: "AdminReportsStack" },
  { label: "Database Management", icon: "database-outline", route: "AdminDatabaseStack" },
  { label: "Audit Logs", icon: "shield-search", route: "AdminAuditLogsStack" },
  { label: "Settings", icon: "cog-outline", route: "AdminSettingsStack" },
];

const LIGHT_TEXT = COLORS.primaryLight;
const MUTED_TEXT = "#7FA8CC";

export function AdminDrawerContent(props) {
  const { admin, logout } = useAuth();
  const activeRoute = props.state.routeNames[props.state.index];

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(admin?.full_name || admin?.username || "A").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.adminName}>{admin?.full_name || admin?.username}</Text>
          <Text style={styles.adminRole}>Administrator</Text>
        </View>
        <Divider style={styles.divider} />
        {ITEMS.map((item) => (
          <DrawerItem
            key={item.route}
            label={item.label}
            labelStyle={{ color: activeRoute === item.route ? COLORS.white : LIGHT_TEXT }}
            icon={({ size }) => (
              <Icon
                source={item.icon}
                size={size}
                color={activeRoute === item.route ? COLORS.white : MUTED_TEXT}
              />
            )}
            focused={activeRoute === item.route}
            activeBackgroundColor="rgba(255,255,255,0.14)"
            onPress={() => props.navigation.navigate(item.route)}
          />
        ))}
        <Divider style={styles.divider} />
        <DrawerItem
          label="Logout"
          icon={({ size }) => <Icon source="logout" size={size} color="#F4A6B0" />}
          labelStyle={{ color: "#F4A6B0" }}
          onPress={logout}
        />
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <SomalilandFlag width={26} height={17} showText={false} />
        <Text style={styles.footerText}>Secure - Transparent - Reliable</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryGreenDark,
  },
  header: {
    padding: 20,
    paddingTop: 28,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "800",
  },
  adminName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  adminRole: {
    fontSize: 11,
    color: MUTED_TEXT,
    marginTop: 2,
  },
  divider: {
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  footerText: {
    fontSize: 10,
    color: MUTED_TEXT,
    fontWeight: "600",
  },
});
