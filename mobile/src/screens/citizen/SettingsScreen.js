import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Divider, Icon, Switch, Text } from "react-native-paper";

import { AppHeader } from "../../components/AppHeader";
import { AppSelect } from "../../components/AppSelect";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "../../hooks/useTranslation";
import { LANGUAGES } from "../../localization/translations";

export function SettingsScreen({ navigation }) {
  const { logout } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title={t("settings")} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>{t("language")}</Text>
        <AppSelect label={t("language")} value={language} options={LANGUAGES} onSelect={setLanguage} />

        <Text style={styles.sectionTitle}>{t("notifications")}</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>In-app notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            color={COLORS.primaryGreen}
          />
        </View>

        <Text style={styles.sectionTitle}>{t("security")}</Text>
        <MenuItem
          icon="lock-outline"
          label="Change Payment PIN"
          onPress={() => navigation.navigate("SetPaymentPin")}
        />

        <Text style={styles.sectionTitle}>General</Text>
        <MenuItem icon="information-outline" label={t("about")} onPress={() => navigation.navigate("About")} />
        <MenuItem icon="bell-outline" label={t("notifications")} onPress={() => navigation.navigate("Notifications")} />

        <MenuItem icon="logout" label={t("logout")} onPress={logout} destructive />
      </ScrollView>
    </View>
  );
}

function MenuItem({ icon, label, onPress, destructive }) {
  return (
    <View>
      <Pressable style={styles.menuItem} onPress={onPress}>
        <Icon source={icon} size={20} color={destructive ? COLORS.danger : COLORS.textPrimary} />
        <Text style={[styles.menuLabel, destructive && { color: COLORS.danger }]}>{label}</Text>
        <Icon source="chevron-right" size={18} color={COLORS.gray} />
      </Pressable>
      <Divider />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginTop: 18,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowLabel: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  menuLabel: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
});
