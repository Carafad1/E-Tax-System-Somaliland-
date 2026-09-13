import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView, StyleSheet, View } from "react-native";
import { Chip, Text } from "react-native-paper";

import { AdminHeader } from "../../components/AdminHeader";
import { ErrorState } from "../../components/ErrorState";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { MiniBarChart } from "../../components/MiniBarChart";
import { StackedBar } from "../../components/StackedBar";
import { COLORS, PAYMENT_METHOD_COLORS } from "../../constants/colors";
import { extractErrorMessage } from "../../services/api";
import {
  getCitiesSummary,
  getPaymentMethodsSummary,
  getRevenue,
} from "../../services/dashboardService";
import { exportReport } from "../../services/reportService";
import { formatAmount, formatPaymentMethodLabel } from "../../utils/formatters";

export function AdminReportsScreen() {
  const [revenue, setRevenue] = useState(null);
  const [methods, setMethods] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(!hasLoadedRef.current);
    setError("");
    try {
      const [revenueData, methodsData, citiesData] = await Promise.all([
        getRevenue(),
        getPaymentMethodsSummary(),
        getCitiesSummary(),
      ]);
      setRevenue(revenueData);
      setMethods(methodsData.items || []);
      setCities(citiesData.items || []);
      hasLoadedRef.current = true;
    } catch (err) {
      if (!hasLoadedRef.current) {
        setError(extractErrorMessage(err, "Unable to load reports."));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleExport = async (type) => {
    setExporting(type);
    try {
      await exportReport(type);
    } catch (err) {
      setError(extractErrorMessage(err, "Unable to export this report."));
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading reports..." fullScreen />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  const trend = revenue?.trend || [];
  const byTaxType = revenue?.by_tax_type || [];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AdminHeader title="Reports" />
      <ScrollView contentContainerStyle={styles.container}>
        <ReportCard title="Revenue Trend">
          {trend.length === 0 ? (
            <NoData />
          ) : (
            <MiniBarChart data={trend.map((t) => ({ label: t.date.slice(5), value: t.total }))} height={200} />
          )}
        </ReportCard>

        <ReportCard title="Revenue by Payment Method (SLSH)">
          {methods.length === 0 ? (
            <NoData />
          ) : (
            <>
              <StackedBar
                segments={methods.map((m) => ({
                  label: m.method,
                  value: m.amount,
                  color: PAYMENT_METHOD_COLORS[m.method] || COLORS.gray,
                }))}
              />
              {methods.map((m) => (
                <View key={m.method} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: PAYMENT_METHOD_COLORS[m.method] || COLORS.gray }]} />
                  <Text style={styles.legendLabel}>{formatPaymentMethodLabel(m.method)}</Text>
                  <Text style={styles.legendValue}>
                    {formatAmount(m.amount, "SLSH")} ({m.percentage}%)
                  </Text>
                </View>
              ))}
            </>
          )}
        </ReportCard>

        <ReportCard title="Tax Type Ranking (SLSH)">
          {byTaxType.length === 0 ? (
            <NoData />
          ) : (
            <MiniBarChart
              data={byTaxType.map((t) => ({ label: t.name.slice(0, 8), value: t.total }))}
              color={COLORS.info}
              height={200}
            />
          )}
        </ReportCard>

        <ReportCard title="Revenue by City (SLSH)">
          {cities.length === 0 ? (
            <NoData />
          ) : (
            <MiniBarChart
              data={cities.map((c) => ({ label: c.city.slice(0, 8), value: c.total_slsh }))}
              color={COLORS.warning}
              height={200}
            />
          )}
        </ReportCard>

        <Text style={styles.sectionTitle}>Export Reports</Text>
        <View style={styles.exportRow}>
          {["payments", "citizens", "receipts"].map((type) => (
            <Chip
              key={type}
              icon="download-outline"
              onPress={() => handleExport(type)}
              disabled={exporting === type}
              style={{ marginRight: 8, marginBottom: 8 }}
            >
              {exporting === type ? "Exporting..." : type.charAt(0).toUpperCase() + type.slice(1)}
            </Chip>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ReportCard({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function NoData() {
  return (
    <View style={styles.noData}>
      <Text style={styles.noDataText}>No data available.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 10,
    marginLeft: 4,
  },
  noData: {
    paddingVertical: 40,
    alignItems: "center",
  },
  noDataText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  exportRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  legendValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
