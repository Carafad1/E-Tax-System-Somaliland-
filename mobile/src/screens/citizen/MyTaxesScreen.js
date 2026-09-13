import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { AppButton } from "../../components/AppButton";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { EmptyState } from "../../components/EmptyState";
import { COLORS } from "../../constants/colors";
import { listTaxTypes } from "../../services/taxTypeService";
import { formatAmount, formatFrequencyLabel } from "../../utils/formatters";

export function MyTaxesScreen({ navigation }) {
  const [taxTypes, setTaxTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const items = await listTaxTypes(true);
      if (items && items.length > 0) {
        setTaxTypes(items);
      }
      hasLoadedRef.current = true;
    } catch (_err) {
      // Quiet background fetch for instant 0ms response
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="My Taxes" />
      <View style={styles.container}>
        <FlatList
          data={taxTypes}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppCard>
              <Text style={styles.name}>{item.name}</Text>
              {!!item.description && <Text style={styles.description}>{item.description}</Text>}
              <View style={styles.row}>
                <Text style={styles.amount}>
                  {formatAmount(item.min_amount_slsh, "SLSH")} / {formatAmount(item.min_amount_usd, "USD")}
                </Text>
                <Text style={styles.frequency}>{formatFrequencyLabel(item.frequency)}</Text>
              </View>
              <AppButton
                style={{ marginTop: 10 }}
                onPress={() => navigation.navigate("PayTax", { taxTypeId: item.id })}
              >
                Pay Now
              </AppButton>
            </AppCard>
          )}
          ListEmptyComponent={<EmptyState icon="file-percent-outline" title="No tax types available." />}
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
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  amount: {
    fontWeight: "700",
    color: COLORS.primaryGreen,
  },
  frequency: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: "capitalize",
  },
});
