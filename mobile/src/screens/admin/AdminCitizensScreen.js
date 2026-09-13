import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Checkbox, Chip, FAB, Icon, Text } from "react-native-paper";

import { AdminHeader } from "../../components/AdminHeader";
import { AppCard } from "../../components/AppCard";
import { ConfirmModal } from "../../components/ConfirmModal";
import { EmptyState } from "../../components/EmptyState";
import { SearchBar } from "../../components/SearchBar";
import { COLORS } from "../../constants/colors";
import { bulkDeleteCitizens, deleteCitizen, listCitizens } from "../../services/userService";

export function AdminCitizensScreen({ navigation }) {
  // Real data only - starts empty, never a fake/demo taxpayer list.
  const [citizens, setCitizens] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hasLoadedRef = useRef(true);

  const load = useCallback(async (searchTerm, pageNum) => {
    try {
      const result = await listCitizens({ search: searchTerm || undefined, page: pageNum, limit: 20 });
      if (result?.items) {
        // Always reflect the real result, including a genuine empty page -
        // a database with 0 taxpayers must show 0, not the previous list.
        setCitizens(result.items);
        setTotalPages(result.pages || 1);
      }
      hasLoadedRef.current = true;
    } catch (_err) {
      // Quiet background fetch for instant 0ms delay
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(search, page);
    }, [load, page])
  );

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (confirmBulk) {
        await bulkDeleteCitizens(selectedIds);
        setSelectedIds([]);
      } else if (confirmTarget) {
        await deleteCitizen(confirmTarget.id);
      }
      setConfirmTarget(null);
      setConfirmBulk(false);
      load(search, page);
    } catch (_err) {
      setConfirmTarget(null);
      setConfirmBulk(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AdminHeader title="Taxpayers" />
      <View style={styles.container}>
        <SearchBar
          placeholder="Search taxpayers by name, phone, TIN..."
          onSearch={(text) => {
            setSearch(text);
            setPage(1);
            load(text, 1);
          }}
        />

        {selectedIds.length > 0 && (
          <View style={styles.selectionBar}>
            <Text style={styles.selectionText}>{selectedIds.length} selected</Text>
            <Chip mode="outlined" onPress={() => setSelectedIds([])} style={{ marginRight: 8 }}>
              Clear
            </Chip>
            <Chip mode="flat" style={{ backgroundColor: COLORS.dangerLight }} onPress={() => setConfirmBulk(true)}>
              Delete Selected
            </Chip>
          </View>
        )}

        <FlatList
          data={citizens}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppCard onPress={() => navigation.navigate("AdminCitizenDetail", { citizenId: item.id })}>
              <View style={styles.row}>
                <Checkbox
                  status={selectedIds.includes(item.id) ? "checked" : "unchecked"}
                  onPress={() => toggleSelect(item.id)}
                  color={COLORS.primaryGreen}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.full_name}</Text>
                  <Text style={styles.meta}>
                    {item.phone} {item.city ? `• ${item.city}` : ""}
                  </Text>
                  <Text style={styles.meta}>TIN: {item.tin}</Text>
                </View>
                <Pressable
                  onPress={() => navigation.navigate("AdminCitizenForm", { citizenId: item.id })}
                  hitSlop={10}
                  style={{ marginRight: 14 }}
                >
                  <Icon source="pencil-outline" size={18} color={COLORS.primaryGreen} />
                </Pressable>
                <Pressable onPress={() => setConfirmTarget(item)} hitSlop={10}>
                  <Text style={styles.delete}>Delete</Text>
                </Pressable>
              </View>
            </AppCard>
          )}
          ListEmptyComponent={<EmptyState icon="account-group-outline" title="No taxpayers found." />}
          contentContainerStyle={{ paddingBottom: 90 }}
        />

        {totalPages > 1 && (
          <View style={styles.pagination}>
            <Chip disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Chip>
            <Text style={styles.pageText}>
              Page {page} of {totalPages}
            </Text>
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
        onPress={() => navigation.navigate("AdminCitizenForm", {})}
      />

      <ConfirmModal
        visible={!!confirmTarget}
        title="Are you sure you want to delete this taxpayer?"
        message={confirmTarget ? `This will permanently remove ${confirmTarget.full_name} and related records.` : ""}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
      <ConfirmModal
        visible={confirmBulk}
        title="Are you sure you want to delete the selected records?"
        message={`This will permanently remove ${selectedIds.length} taxpayer(s).`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmBulk(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  selectionText: {
    flex: 1,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontWeight: "700",
    fontSize: 14,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  delete: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  pageText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.primaryGreen,
  },
});
