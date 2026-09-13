import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Chip, FAB } from "react-native-paper";

import { AdminHeader } from "../../components/AdminHeader";
import { ConfirmModal } from "../../components/ConfirmModal";
import { EmptyState } from "../../components/EmptyState";
import { FilterPanel } from "../../components/FilterPanel";
import { PaymentCard } from "../../components/PaymentCard";
import { SearchBar } from "../../components/SearchBar";
import { COLORS } from "../../constants/colors";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "../../constants/config";
import { deletePayment, listPayments } from "../../services/paymentService";

const FILTER_FIELDS = [
  {
    key: "status",
    label: "Status",
    options: PAYMENT_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
  },
  { key: "payment_method", label: "Payment Method", options: PAYMENT_METHODS },
];

export function AdminPaymentsScreen({ navigation }) {
  // Real data only - starts empty, never fake/demo payments.
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [filterVisible, setFilterVisible] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const hasLoadedRef = useRef(true);

  const load = useCallback(async (searchTerm, activeFilters, pageNum) => {
    try {
      const result = await listPayments({ search: searchTerm || undefined, ...activeFilters, page: pageNum, limit: 20 });
      if (result?.items) {
        // Always reflect the real result, including a genuine empty page.
        setPayments(result.items);
        setTotalPages(result.pages || 1);
      }
      hasLoadedRef.current = true;
    } catch (_err) {
      // Quiet background handling for zero delay
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(search, filters, page);
    }, [load, page])
  );

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePayment(confirmTarget.id);
      setConfirmTarget(null);
      load(search, filters, page);
    } catch (_err) {
      setConfirmTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AdminHeader title="Payments" actions={[{ icon: "filter-variant", onPress: () => setFilterVisible(true) }]} />
      <View style={styles.container}>
        <SearchBar
          placeholder="Search by reference, citizen..."
          onSearch={(text) => {
            setSearch(text);
            setPage(1);
            load(text, filters, 1);
          }}
        />

        <FlatList
          data={payments}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View>
              <PaymentCard payment={item} onPress={() => navigation.navigate("AdminPaymentForm", { paymentId: item.id })} />
              <View style={styles.cardActions}>
                {item.has_receipt && (
                  <Pressable
                    onPress={() => navigation.navigate("AdminReceiptDetail", { referenceId: item.reference_id })}
                  >
                    <Chip icon="receipt" compact style={{ marginRight: 8 }}>
                      View Receipt
                    </Chip>
                  </Pressable>
                )}
                <Pressable onPress={() => setConfirmTarget(item)}>
                  <Chip icon="delete-outline" compact style={{ backgroundColor: COLORS.dangerLight }}>
                    Delete
                  </Chip>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={<EmptyState icon="cash-multiple" title="No payments found." />}
          contentContainerStyle={{ paddingBottom: 90 }}
        />

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

      <FAB
        icon="plus"
        style={styles.fab}
        color={COLORS.white}
        onPress={() => navigation.navigate("AdminPaymentForm", {})}
      />

      <FilterPanel
        visible={filterVisible}
        fields={FILTER_FIELDS}
        values={filters}
        onChange={setFilters}
        onApply={(vals) => {
          setFilterVisible(false);
          setPage(1);
          load(search, vals, 1);
        }}
        onClear={() => {
          setFilters({});
          setFilterVisible(false);
          setPage(1);
          load(search, {}, 1);
        }}
        onClose={() => setFilterVisible(false)}
      />

      <ConfirmModal
        visible={!!confirmTarget}
        title="Are you sure you want to delete this payment?"
        message={confirmTarget ? `Reference: ${confirmTarget.reference_id}` : ""}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  cardActions: {
    flexDirection: "row",
    marginTop: -6,
    marginBottom: 12,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.primaryGreen,
  },
});
