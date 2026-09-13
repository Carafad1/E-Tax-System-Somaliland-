import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import { AppHeader } from "../../components/AppHeader";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { COLORS } from "../../constants/colors";
import { extractErrorMessage } from "../../services/api";
import { listNotifications, markNotificationRead } from "../../services/notificationService";
import { formatDate } from "../../utils/formatters";

const TYPE_ICONS = {
  payment: "cash-check",
  reminder: "bell-alert-outline",
  receipt: "receipt",
  announcement: "bullhorn-outline",
  general: "bell-outline",
};

export function NotificationsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(!hasLoadedRef.current);
    setError("");
    try {
      const data = await listNotifications();
      setItems(data.items);
      hasLoadedRef.current = true;
    } catch (err) {
      if (!hasLoadedRef.current) {
        setError(extractErrorMessage(err, "Unable to load notifications."));
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

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Notifications" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        {loading ? (
          <LoadingSpinner label="Loading notifications..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.item, !item.is_read && styles.itemUnread]}
                onPress={() => {
                  if (!item.is_read) {
                    markNotificationRead(item.id).then(load).catch(() => {});
                  }
                }}
              >
                <Icon source={TYPE_ICONS[item.type] || "bell-outline"} size={22} color={COLORS.primaryGreen} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.message}>{item.message}</Text>
                  <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={<EmptyState icon="bell-off-outline" title="No notifications yet." />}
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
  item: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  itemUnread: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryGreen,
  },
  title: {
    fontWeight: "700",
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  message: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  date: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 6,
  },
});
