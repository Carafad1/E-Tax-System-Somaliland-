import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView, StyleSheet, View } from "react-native";
import { Divider, Text } from "react-native-paper";
import QRCode from "react-native-qrcode-svg";

import { AppButton } from "../../components/AppButton";
import { AppHeader } from "../../components/AppHeader";
import { ErrorState } from "../../components/ErrorState";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { COLORS } from "../../constants/colors";
import { extractErrorMessage } from "../../services/api";
import { downloadAndShareReceiptPdf, getReceipt } from "../../services/receiptService";
import { formatAmount, formatDate, formatFrequencyLabel } from "../../utils/formatters";

export function ReceiptScreen({ route, navigation }) {
  const { referenceId, preloadedReceipt } = route.params;
  const [receipt, setReceipt] = useState(preloadedReceipt || null);
  const [loading, setLoading] = useState(!preloadedReceipt);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const hasLoadedRef = useRef(!!preloadedReceipt);

  const load = useCallback(async () => {
    setLoading(!hasLoadedRef.current);
    setError("");
    try {
      const data = await getReceipt(referenceId, preloadedReceipt || null);
      setReceipt(data);
      hasLoadedRef.current = true;
    } catch (err) {
      if (!hasLoadedRef.current) {
        setError(extractErrorMessage(err, "Unable to load this receipt."));
      }
    } finally {
      setLoading(false);
    }
  }, [referenceId, preloadedReceipt]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError("");
    try {
      await downloadAndShareReceiptPdf(referenceId, receipt);
    } catch (_err) {
      // Handled safely in service layer
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Digital Receipt" onBack={() => navigation.goBack()} />

      {loading ? (
        <LoadingSpinner label="Loading receipt..." fullScreen />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.receiptCard}>
            <Text style={styles.gov}>REPUBLIC OF SOMALILAND</Text>
            <Text style={styles.ministry}>MINISTRY OF FINANCE</Text>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>E-TAX DIGITAL RECEIPT</Text>
            </View>

            <Row label="Receipt Number" value={receipt.receipt_number} />
            <Row label="Reference ID" value={receipt.reference_id} />
            <Row label="Transaction ID" value={receipt.transaction_id} />
            <Row label="Taxpayer ID" value={receipt.taxpayer_id} />
            <Row label="Citizen Name" value={receipt.citizen_name} />
            <Row label="Business Name" value={receipt.business_name || "-"} />
            <Row label="Tax Type" value={receipt.tax_type} />
            <Row label="Frequency" value={formatFrequencyLabel(receipt.tax_type_frequency)} />
            <Row label="Payment Method" value={receipt.payment_method} />
            <Row label="Currency" value={receipt.currency} />
            <Row label="Amount" value={formatAmount(receipt.amount, receipt.currency)} />
            <Row label="Payment Date" value={formatDate(receipt.payment_date)} />
            <Row label="Status" value={(receipt.status || "").toUpperCase()} last />

            <View style={styles.qrWrap}>
              <QRCode value={receipt.reference_id} size={140} />
              <Text style={styles.qrCaption}>Scan to verify: {receipt.reference_id}</Text>
            </View>
          </View>

          {!!downloadError && <Text style={styles.downloadError}>{downloadError}</Text>}

          <AppButton style={{ marginTop: 16 }} loading={downloading} onPress={handleDownload}>
            Download PDF
          </AppButton>
          <AppButton mode="outlined" style={{ marginTop: 10 }} onPress={handleDownload} loading={downloading}>
            Share Receipt
          </AppButton>
          <AppButton
            mode="text"
            style={{ marginTop: 4 }}
            onPress={() => navigation.navigate("VerifyReceipt", { referenceId })}
          >
            Verify Receipt
          </AppButton>
        </ScrollView>
      )}
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
  receiptCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  gov: {
    textAlign: "center",
    fontWeight: "800",
    color: COLORS.primaryGreen,
    fontSize: 15,
  },
  ministry: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  headerBadge: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 14,
  },
  headerBadgeText: {
    textAlign: "center",
    color: COLORS.white,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
  },
  rowLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  rowValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  qrWrap: {
    alignItems: "center",
    marginTop: 20,
  },
  qrCaption: {
    marginTop: 10,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  downloadError: {
    color: COLORS.danger,
    marginTop: 12,
    textAlign: "center",
  },
});
