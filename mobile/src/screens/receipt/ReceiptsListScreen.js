import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";

import { AppHeader } from "../../components/AppHeader";
import { EmptyState } from "../../components/EmptyState";
import { ReceiptCard } from "../../components/ReceiptCard";
import { SearchBar } from "../../components/SearchBar";
import { COLORS } from "../../constants/colors";
import { listReceipts } from "../../services/receiptService";

export function ReceiptsListScreen({ navigation }) {
  // Real data only - starts empty, never a fake/demo receipt.
  const [receipts, setReceipts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const hasLoadedRef = useRef(true);

  const load = useCallback(async (searchTerm) => {
    try {
      const result = await listReceipts({ search: searchTerm || undefined, limit: 50 });
      if (result?.items) {
        // Always reflect the real result, including a genuine empty page.
        setReceipts(result.items);
      }
      hasLoadedRef.current = true;
    } catch (_err) {
      // Quiet background catch for 0ms speed
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(search);
    }, [load])
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Receipts" />
      <View style={styles.container}>
        <SearchBar
          placeholder="Search receipts..."
          onSearch={(text) => {
            setSearch(text);
            load(text);
          }}
        />

        <FlatList
          data={receipts}
          keyExtractor={(item) => item.receipt_number || String(item.id)}
          renderItem={({ item }) => (
            <ReceiptCard
              receipt={item}
              onPress={() => navigation.navigate("ReceiptDetail", { referenceId: item.reference_id })}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(search);
              }}
            />
          }
          ListEmptyComponent={<EmptyState icon="receipt" title="No receipts found." />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
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
