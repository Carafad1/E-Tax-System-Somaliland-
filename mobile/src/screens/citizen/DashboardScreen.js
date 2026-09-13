import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorState } from "../../components/ErrorState";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { SomalilandFlag } from "../../components/SomalilandFlag";
import { StatCard } from "../../components/StatCard";
import { API_ORIGIN } from "../../constants/config";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { extractErrorMessage } from "../../services/api";
import { getStats } from "../../services/dashboardService";
import { formatAmount, formatStatusLabel } from "../../utils/formatters";

const QUICK_ACTIONS = [
  { label: "PAY TAX", icon: "cash-plus", tab: "TaxesTab", screen: "MyTaxes", color: "#062E8A" },
  { label: "GET RECEIPT", icon: "receipt", tab: "ReceiptsTab", screen: "ReceiptsList", color: "#062E8A" },
  { label: "VERIFY QR", icon: "qrcode-scan", screen: "Notifications", color: "#062E8A" },
  { label: "MY PROFILE", icon: "account-circle-outline", tab: "ProfileTab", screen: "Profile", color: "#062E8A" },
  { label: "PAYMENT PIN", icon: "shield-check-outline", tab: "ProfileTab", screen: "SetPaymentPin", color: "#062E8A" },
  { label: "NOTIFICATIONS", icon: "bell-outline", screen: "Notifications", color: "#062E8A" },
];

export function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  // No hardcoded/placeholder values - real data only. Null until the first
  // successful fetch resolves; the render below shows "-"/0 for missing
  // fields (never an invented number), matching every other dashboard.
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await getStats();
      if (data) setStats(data);
      hasLoadedRef.current = true;
    } catch (err) {
      // Surfaced, never swallowed into zeros: "0.00 SLSH paid" is a claim
      // about this citizen's tax record, and must only ever come from the
      // server. A later background refresh failing keeps whatever real
      // figures are already on screen.
      if (!hasLoadedRef.current) {
        setError(extractErrorMessage(err, "Unable to load your dashboard."));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleQuickAction = (action) => {
    if (action.tab) {
      navigation.getParent()?.navigate(action.tab, { screen: action.screen });
    } else {
      navigation.navigate(action.screen);
    }
  };

  if (loading && !refreshing) {
    return <LoadingSpinner label="Loading dashboard..." fullScreen />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <Pressable
          style={styles.heroAvatar}
          onPress={() => navigation.getParent()?.navigate("ProfileTab", { screen: "Profile" })}
        >
          {user?.avatar_url ? (
            <Image source={{ uri: `${API_ORIGIN}${user.avatar_url}` }} style={styles.heroAvatarImage} />
          ) : (
            <Icon source="account" size={22} color={COLORS.white} />
          )}
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcome}>Welcome, {user?.full_name?.split(" ")[0] || "Citizen"}</Text>
          <Text style={styles.tin}>TIN: {user?.tin}</Text>
        </View>
        <SomalilandFlag width={44} height={29} showText={false} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
      <View style={styles.statsGrid}>
        <StatCard label="Taxpayer ID" value={stats?.taxpayer_id || "-"} icon="card-account-details-outline" />
        <StatCard
          label="Total Tax Paid"
          value={formatAmount(stats?.total_tax_paid, "SLSH")}
          icon="cash-check"
          color={COLORS.primaryGreen}
        />
        <StatCard label="Outstanding Tax" value={stats?.outstanding_tax ?? 0} icon="alert-circle-outline" color={COLORS.warning} />
        <StatCard
          label="Payment Status"
          value={formatStatusLabel(stats?.payment_status) || "None"}
          icon="progress-check"
          color={COLORS.info}
        />
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.label}
            style={styles.actionCard}
            android_ripple={{ color: COLORS.border }}
            onPress={() => handleQuickAction(action)}
          >
            <View style={styles.actionIconWrap}>
              <Icon source={action.icon} size={22} color={COLORS.primaryGreen} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryGreen,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 12,
  },
  heroAvatarImage: {
    width: 40,
    height: 40,
  },
  welcome: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.white,
  },
  tin: {
    fontSize: 12,
    color: COLORS.primaryLight,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    flexBasis: "31%",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryGreenLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    color: COLORS.textPrimary,
    textAlign: "center",
    fontWeight: "600",
  },
});
