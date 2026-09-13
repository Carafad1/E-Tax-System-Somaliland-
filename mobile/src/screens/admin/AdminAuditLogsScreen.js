import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, StyleSheet, View } from "react-native";
import { Chip, Text } from "react-native-paper";

import { AdminHeader } from "../../components/AdminHeader";
import { AppCard } from "../../components/AppCard";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { COLORS } from "../../constants/colors";
import { extractErrorMessage } from "../../services/api";
import { listAuditLogs } from "../../services/auditService";
import { formatDate } from "../../utils/formatters";

export function AdminAuditLogsScreen() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (pageNum) => {
    setLoading(!hasLoadedRef.current);
    setError("");
    try {
      const result = await listAuditLogs({ page: pageNum, limit: 30 });
      setLogs(result.items);
      setTotalPages(result.pages);
      hasLoadedRef.current = true;
    } catch (err) {
      if (!hasLoadedRef.current) {
        setError(extractErrorMessage(err, "Unable to load audit logs."));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(page);
    }, [load, page])
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AdminHeader title="Audit Logs" />
      <View style={styles.container}>
        {loading ? (
          <LoadingSpinner label="Loading audit logs..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load(page)} />
        ) : (
          <FlatList
            data={logs}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <AppCard>
                <View style={styles.row}>
                  <Text style={styles.action}>{item.action.toUpperCase()}</Text>
                  <Text style={styles.entity}>{item.entity_type}</Text>
                </View>
                <Text style={styles.description}>{item.description}</Text>
                <Text style={styles.meta}>
                  {item.admin_username || "system"} • {formatDate(item.created_at)}
                </Text>
              </AppCard>
            )}
            ListEmptyComponent={<EmptyState icon="shield-search" title="No audit log entries." />}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}

        {totalPages > 1 && (
          <View style={styles.pagination}>
            <Chip disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Chip>
            <Chip disabled={page >= totalPages} onPress={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </Chip>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  action: {
    fontWeight: "700",
    fontSize: 12,
    color: COLORS.primaryGreen,
  },
  entity: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: "capitalize",
  },
  description: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  meta: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 6,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
});
