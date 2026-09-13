import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView, StyleSheet, View } from "react-native";
import { Chip, Text } from "react-native-paper";

import { AdminHeader } from "../../components/AdminHeader";
import { ErrorState } from "../../components/ErrorState";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { COLORS, STATUS_COLORS } from "../../constants/colors";
import { extractErrorMessage } from "../../services/api";
import { listPayments } from "../../services/paymentService";
import { getCitizen } from "../../services/userService";
import { formatAmount, formatDate, formatStatusLabel } from "../../utils/formatters";

export function AdminCitizenDetailScreen({ route, navigation }) {
  const citizenId = route.params?.citizenId;
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [citizenData, paymentsData] = await Promise.all([
        getCitizen(citizenId),
        listPayments({ user_id: citizenId, limit: 5, sort: "-created_at" }),
      ]);
      setUser(citizenData.user);
      setPayments(paymentsData.items || []);
    } catch (err) {
      setError(extractErrorMessage(err, "Unable to load this citizen."));
    } finally {
      setLoading(false);
    }
  }, [citizenId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <AdminHeader title="Citizen Details" onBack={() => navigation.goBack()} />
        <LoadingSpinner label="Loading citizen..." fullScreen />
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <AdminHeader title="Citizen Details" onBack={() => navigation.goBack()} />
        <ErrorState message={error || "Citizen not found."} onRetry={load} />
      </View>
    );
  }

  const statusColor = STATUS_COLORS[user.status] || STATUS_COLORS.completed;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AdminHeader
        title="Citizen Details"
        onBack={() => navigation.goBack()}
        actions={[{ icon: "pencil-outline", onPress: () => navigation.navigate("AdminCitizenForm", { citizenId }) }]}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user.full_name || "?").charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user.full_name}</Text>
          <Text style={styles.tin}>TIN: {user.tin}</Text>
          <Chip
            style={{ backgroundColor: statusColor.bg, marginTop: 8 }}
            textStyle={{ color: statusColor.text, fontWeight: "700", fontSize: 11 }}
          >
            {formatStatusLabel(user.status)}
          </Chip>
        </View>

        <Section title="Identity">
          <Row label="Full Name" value={user.full_name} />
          <Row label="ID Number" value={user.id_number} />
          <Row label="Taxpayer Type" value={user.taxpayer_type === "business" ? "Business" : "Individual"} />
          {user.taxpayer_type === "business" && (
            <>
              <Row label="Business Name" value={user.business_name} />
              <Row label="Business Type" value={user.business_type} />
              <Row label="Registration Number" value={user.registration_number} />
            </>
          )}
        </Section>

        <Section title="Contact">
          <Row label="Phone" value={user.phone} />
          <Row label="Email" value={user.email} />
          <Row label="City" value={user.city} />
          <Row label="Address" value={user.address} />
          <Row label="Occupation" value={user.occupation} />
        </Section>

        <Section title="Account">
          <Row label="Payment PIN Set" value={user.has_payment_pin ? "Yes" : "No"} />
          <Row label="Registered On" value={formatDate(user.created_at)} />
          <Row label="Last Updated" value={formatDate(user.updated_at)} />
        </Section>

        <Section title="Recent Payments">
          {payments.length === 0 ? (
            <Text style={styles.emptyText}>No payments recorded yet.</Text>
          ) : (
            payments.map((p) => (
              <View key={p.id} style={styles.paymentRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentRef}>{p.reference_id}</Text>
                  <Text style={styles.paymentMeta}>{p.tax_type} • {formatDate(p.created_at)}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.paymentAmount}>{formatAmount(p.amount, p.currency)}</Text>
                  <Text style={[styles.paymentStatus, { color: (STATUS_COLORS[p.status] || {}).text || COLORS.gray }]}>
                    {formatStatusLabel(p.status)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value || "-"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: "800",
  },
  name: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  tin: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primaryGreen,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  rowLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flexShrink: 0,
  },
  rowValue: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  paymentRef: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  paymentMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  paymentStatus: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
});
