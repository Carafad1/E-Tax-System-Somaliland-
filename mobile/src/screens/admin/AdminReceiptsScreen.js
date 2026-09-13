import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, StyleSheet, View } from "react-native";

import { AdminHeader } from "../../components/AdminHeader";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { ReceiptCard } from "../../components/ReceiptCard";
import { SearchBar } from "../../components/SearchBar";
import { COLORS } from "../../constants/colors";
import { extractErrorMessage } from "../../services/api";
import { listReceipts } from "../../services/receiptService";

export function AdminReceiptsScreen({ navigation }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (searchTerm) => {
    setLoading(!hasLoadedRef.current);
    setError("");
    try {
      const result = await listReceipts({ search: searchTerm || undefined, limit: 50 });
      setReceipts(result.items);
      hasLoadedRef.current = true;
    } catch (err) {
      if (!hasLoadedRef.current) {
        setError(extractErrorMessage(err, "Unable to load receipts."));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(search);
    }, [load])
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AdminHeader title="Receipts" />
      <View style={styles.container}>
        <SearchBar
          placeholder="Search receipt or reference..."
          onSearch={(text) => {
            setSearch(text);
            load(text);
          }}
        />

        {loading ? (
          <LoadingSpinner label="Loading receipts..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load(search)} />
        ) : (
          <FlatList
            data={receipts}
            keyExtractor={(item) => item.receipt_number}
            renderItem={({ item }) => (
              <ReceiptCard
                receipt={item}
                onPress={() => navigation.navigate("AdminReceiptDetail", { referenceId: item.reference_id })}
              />
            )}
            ListEmptyComponent={<EmptyState icon="receipt" title="No receipts found." />}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
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
});
