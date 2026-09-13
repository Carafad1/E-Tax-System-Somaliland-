import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, StyleSheet, View } from "react-native";
import { FAB, Text } from "react-native-paper";

import { AdminHeader } from "../../components/AdminHeader";
import { AppCard } from "../../components/AppCard";
import { ConfirmModal } from "../../components/ConfirmModal";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { COLORS } from "../../constants/colors";
import { extractErrorMessage } from "../../services/api";
import { deactivateCity, listCities } from "../../services/cityService";

export function AdminCitiesScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(!hasLoadedRef.current);
    setError("");
    try {
      const data = await listCities(false);
      setItems(data);
      hasLoadedRef.current = true;
    } catch (err) {
      if (!hasLoadedRef.current) {
        setError(extractErrorMessage(err, "Unable to load cities."));
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

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await deactivateCity(confirmTarget.id);
      setConfirmTarget(null);
      load();
    } catch (err) {
      setError(extractErrorMessage(err, "Unable to deactivate this city."));
      setConfirmTarget(null);
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AdminHeader title="Cities" />
      <View style={styles.container}>
        {loading ? (
          <LoadingSpinner label="Loading cities..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <AppCard onPress={() => navigation.navigate("AdminCityForm", { cityId: item.id })}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>
                      {item.name} {!item.is_active && <Text style={styles.inactiveBadge}>(inactive)</Text>}
                    </Text>
                    {!!item.region && <Text style={styles.meta}>{item.region}</Text>}
                  </View>
                  {item.is_active && (
                    <Text style={styles.deactivate} onPress={() => setConfirmTarget(item)}>
                      Deactivate
                    </Text>
                  )}
                </View>
              </AppCard>
            )}
            ListEmptyComponent={<EmptyState icon="city-variant-outline" title="No cities found." />}
            contentContainerStyle={{ paddingBottom: 90 }}
          />
        )}
      </View>

      <FAB icon="plus" style={styles.fab} color={COLORS.white} onPress={() => navigation.navigate("AdminCityForm", {})} />

      <ConfirmModal
        visible={!!confirmTarget}
        title="Deactivate this city?"
        message={confirmTarget ? `${confirmTarget.name} will no longer appear as an active option.` : ""}
        confirmLabel="Deactivate"
        loading={deactivating}
        onConfirm={handleDeactivate}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontWeight: "700",
    fontSize: 14,
  },
  inactiveBadge: {
    color: COLORS.gray,
    fontWeight: "400",
    fontSize: 12,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  deactivate: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.primaryGreen,
  },
});
