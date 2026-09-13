import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";

import { AppHeader } from "../../components/AppHeader";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { FilterPanel } from "../../components/FilterPanel";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { PaymentCard } from "../../components/PaymentCard";
import { SearchBar } from "../../components/SearchBar";
import { COLORS } from "../../constants/colors";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "../../constants/config";
import { extractErrorMessage } from "../../services/api";
import { listPayments } from "../../services/paymentService";

const FILTER_FIELDS = [
  {
    key: "status",
    label: "Status",
    options: PAYMENT_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
  },
  { key: "payment_method", label: "Payment Method", options: PAYMENT_METHODS },
];

export function PaymentHistoryScreen({ navigation }) {
  // Real data only - starts empty, never fake/demo payments.
  const [payments, setPayments] = useState([]);
  // Starts true so the very first render is a spinner, not "No payments
  // found." - an empty list here is a statement about the citizen's record,
  // and must never be shown before the record has actually been fetched.
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [filterVisible, setFilterVisible] = useState(false);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (searchTerm, activeFilters) => {
    setError("");
    try {
      const result = await listPayments({
        search: searchTerm || undefined,
        ...activeFilters,
        limit: 50,
      });
      if (result?.items) {
        // Always reflect the real result, including a genuine empty page.
        setPayments(result.items);
      }
      hasLoadedRef.current = true;
    } catch (err) {
      // A failed load must not look like "you have no payments" - an empty
      // list on a tax history screen is a factual claim about the citizen's
      // record. Once a real list has loaded, a later background refresh
      // failing keeps what is already on screen instead of replacing it.
      if (!hasLoadedRef.current) {
        setError(extractErrorMessage(err, "Unable to load your payments."));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(search, filters);
    }, [load])
  );

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <AppHeader title="My Payments" />
        <LoadingSpinner label="Loading your payments…" fullScreen />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <AppHeader title="My Payments" />
        <ErrorState message={error} onRetry={() => load(search, filters)} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="My Payments" actions={[{ icon: "filter-variant", onPress: () => setFilterVisible(true) }]} />
      <View style={styles.container}>
        <SearchBar
          placeholder="Search by reference, tax type..."
          onSearch={(text) => {
            setSearch(text);
            load(text, filters);
          }}
        />

        <FlatList
          data={payments}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PaymentCard
              payment={item}
              onPress={() =>
                item.has_receipt || item.reference_id
                  ? navigation.navigate("ReceiptDetail", { referenceId: item.reference_id })
                  : null
              }
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(search, filters);
              }}
            />
          }
          ListEmptyComponent={<EmptyState icon="cash-multiple" title="No payments found." />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </View>

      <FilterPanel
        visible={filterVisible}
        fields={FILTER_FIELDS}
        values={filters}
        onChange={setFilters}
        onApply={(vals) => {
          setFilterVisible(false);
          load(search, vals);
        }}
        onClear={() => {
          setFilters({});
          setFilterVisible(false);
          load(search, {});
        }}
        onClose={() => setFilterVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
