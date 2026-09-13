/**
 * AdminDashboardScreen — E-Tax Somaliland
 * Design: matches reference image (blue government dashboard)
 * Data: 100% real database — no fake/demo data ever shown
 */
import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Icon, Text } from "react-native-paper";

import { AdminHeader } from "../../components/AdminHeader";
import { ErrorState } from "../../components/ErrorState";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { SearchBar } from "../../components/SearchBar";
import { API_ORIGIN } from "../../constants/config";
import { PAYMENT_METHOD_COLORS, STATUS_COLORS } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { extractErrorMessage } from "../../services/api";
import { getOverview } from "../../services/dashboardService";
import { listCitizens } from "../../services/userService";
import { listPayments } from "../../services/paymentService";
import {
  formatAmount,
  formatDate,
  formatFrequencyLabel,
  formatPaymentMethodLabel,
  formatStatusLabel,
} from "../../utils/formatters";

// ── colour tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:   "#062E8A",
  navyDk: "#041F61",
  green:  "#16A34A",
  amber:  "#D97706",
  violet: "#7C3AED",
  red:    "#DC2626",
  sky:    "#0891B2",
  pink:   "#DB2777",
};
const RANK_COLORS = [C.navy, C.navyDk, C.amber, C.green, C.violet, C.red, C.sky];

// ── simple ring ───────────────────────────────────────────────────────────────
function Ring({ size = 80, pct = 0, color = C.navy, label, sub }) {
  const thick = size * 0.13;
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        {/* background ring */}
        <View style={{
          position: "absolute",
          width: size, height: size, borderRadius: size / 2,
          borderWidth: thick, borderColor: "#E2E8F0",
        }} />
        {/* foreground arc — we fake it with a coloured ring rotated;
            this is intentionally simple to avoid native rendering crashes */}
        <View style={{
          position: "absolute",
          width: size, height: size, borderRadius: size / 2,
          borderWidth: thick,
          borderColor: "transparent",
          borderTopColor: color,
          borderRightColor: pct > 50 ? color : "transparent",
          transform: [{ rotate: "-90deg" }],
        }} />
        <Text style={{ fontSize: size * 0.18, fontWeight: "800", color }}>{pct}%</Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: "800", color }}>{label}</Text>
      {sub ? <Text style={styles.muted}>{sub}</Text> : null}
    </View>
  );
}

// ── tiny bar ─────────────────────────────────────────────────────────────────
function Bar({ pct = 0, color = C.navy, height = 5 }) {
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: "#E2E8F0", overflow: "hidden" }}>
      <View style={{ height, borderRadius: height / 2, width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
    </View>
  );
}

// ── status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ text = "", bg = "#E2E8F0", fg = "#64748B" }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ fontSize: 9, fontWeight: "700", color: fg }}>{text}</Text>
    </View>
  );
}

// ── tag ───────────────────────────────────────────────────────────────────────
function Tag({ text = "", color = C.navy }) {
  return (
    <View style={{ backgroundColor: color + "18", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
      <Text style={{ fontSize: 9, fontWeight: "700", color }}>{text}</Text>
    </View>
  );
}

// ── no data placeholder ───────────────────────────────────────────────────────
function NoData({ text = "No data available" }) {
  return (
    <View style={styles.noData}>
      <Icon source="database-off-outline" size={28} color="#CBD5E1" />
      <Text style={styles.noDataTxt}>{text}</Text>
    </View>
  );
}

// ── panel wrapper ─────────────────────────────────────────────────────────────
function Panel({ title, action, actionLabel = "View All", children, style }) {
  return (
    <View style={[styles.panel, style]}>
      <View style={styles.panelHead}>
        <Text style={styles.panelTitle}>{title}</Text>
        {action ? (
          <Pressable onPress={action}>
            <Text style={styles.link}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export function AdminDashboardScreen({ navigation }) {
  const { admin } = useAuth();
  const [overview,        setOverview]        = useState(null);
  const [recentPayments,  setRecentPayments]  = useState([]);
  const [recentCitizens,  setRecentCitizens]  = useState([]);
  const [activeTab,       setActiveTab]       = useState("taxpayers");
  const [searchText,      setSearchText]      = useState("");
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [error,           setError]           = useState("");
  const inFlight = useRef(false);
  const hasLoadedRef = useRef(false);
  const searchRef = useRef("");
  searchRef.current = searchText;

  // Stable identity (no state deps) so useFocusEffect below re-runs only on
  // actual focus events, not on every render - see AdminCitizensScreen /
  // AdminPaymentsScreen for the same pattern.
  const load = useCallback(async (search = "") => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (!hasLoadedRef.current) setLoading(true);
    setError("");
    try {
      const [ov, pmts, ctizs] = await Promise.all([
        getOverview(),
        listPayments({ search: search || undefined, limit: 8, sort: "-created_at" }),
        listCitizens({ search: search || undefined, limit: 8, sort: "-created_at" }),
      ]);
      setOverview(ov);
      setRecentPayments(pmts?.items || []);
      const dbTaxpayers = ov?.recent_taxpayers || [];
      setRecentCitizens(
        search
          ? ctizs?.items || []
          : dbTaxpayers.length > 0 ? dbTaxpayers : ctizs?.items || []
      );
      hasLoadedRef.current = true;
    } catch (e) {
      if (!hasLoadedRef.current) setError(extractErrorMessage(e, "Unable to load dashboard."));
    } finally {
      setLoading(false);
      setRefreshing(false);
      inFlight.current = false;
    }
  }, []);

  // Refetch every time this tab regains focus (e.g. after registering a
  // taxpayer or completing a payment elsewhere) - not just on first mount -
  // so the dashboard never shows stale data without requiring a manual
  // pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      load(searchRef.current);
    }, [load])
  );

  const navTo = useCallback((stackName, params) => {
    const parentNav = navigation.getParent() || navigation;
    if (params) {
      parentNav.navigate(stackName, params);
    } else {
      parentNav.navigate(stackName);
    }
  }, [navigation]);

  // ── guards ────────────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <View style={styles.root}>
        <AdminHeader title="Dashboard" />
        <LoadingSpinner label="Loading dashboard…" fullScreen />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.root}>
        <AdminHeader title="Dashboard" />
        <ErrorState message={error} onRetry={() => load(searchText)} />
      </View>
    );
  }

  // ── data ──────────────────────────────────────────────────────────────────
  const sc      = overview?.stat_cards        || {};
  const payOv   = overview?.payments_overview || {};
  const methods = overview?.payment_methods   || [];
  const currs   = overview?.revenue_by_currency || [];
  const taxRank = overview?.tax_type_ranking  || [];
  const cities  = overview?.cities            || [];
  const trend   = overview?.revenue_trend_monthly || [];

  const totalPmts   = Number(sc.total_payments   ?? 0);
  const completed   = Number(payOv.completed ?? 0);
  const pending     = Number(payOv.pending   ?? 0);
  const rejected    = Number(payOv.failed    ?? 0);
  const statusTotal = completed + pending + rejected || 1;

  const cPct = Math.round((completed / statusTotal) * 100);
  const pPct = Math.round((pending   / statusTotal) * 100);
  const rPct = Math.round((rejected  / statusTotal) * 100);

  const activeCities = cities.filter(c => (c.payment_count > 0 || c.total_slsh > 0 || c.total_usd > 0));
  const maxCity = Math.max(...activeCities.map(c => c.total_slsh + c.total_usd), 1);

  const slshTotal = currs.find(c => c.currency === "SLSH")?.total || 0;
  const usdTotal  = currs.find(c => c.currency === "USD")?.total  || 0;
  const revTotal  = slshTotal + usdTotal || 1;
  const slshPct   = Math.round((slshTotal / revTotal) * 100);
  const usdPct    = 100 - slshPct;

  const maxTrend = Math.max(...trend.map(t => t.total), 1);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <AdminHeader title="Dashboard" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(searchText); }}
            colors={[C.navy]}
          />
        }
      >
        {/* ── welcome ─────────────────────────────────────────────────── */}
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.welcomeH}>Dashboard</Text>
            <Text style={styles.welcomeSub}>Welcome back, {admin?.full_name || admin?.username || "Admin"}</Text>
          </View>
          <Pressable
            onPress={() => navTo("AdminDatabaseStack")}
            style={[styles.dbPill,
              { backgroundColor: sc.database_status === "Connected" ? "#DCFCE7" : "#FEE2E2" }]}
          >
            <View style={[styles.dbDot,
              { backgroundColor: sc.database_status === "Connected" ? C.green : C.red }]} />
            <Text style={[styles.dbTxt,
              { color: sc.database_status === "Connected" ? C.green : C.red }]}>
              {sc.database_status === "Connected" ? "DB Connected" : "DB Offline"}
            </Text>
          </Pressable>
        </View>

        {/* ── 4 stat cards ────────────────────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardScroll}>
          <StatCard icon="cash-multiple" color={C.navy} label="Total Revenue (SLSH)" value={formatAmount(sc.total_revenue_slsh ?? 0, "SLSH")} change={sc.total_revenue_slsh_change} onPress={() => navTo("AdminReportsStack")} />
          <StatCard icon="currency-usd" color={C.green} label="Total Revenue (USD)" value={formatAmount(sc.total_revenue_usd ?? 0, "USD")} change={sc.total_revenue_usd_change} onPress={() => navTo("AdminReportsStack")} />
          <StatCard icon="account-group" color={C.violet} label="Total Taxpayers" value={(sc.total_taxpayers ?? 0).toLocaleString()} change={sc.total_taxpayers_change} onPress={() => navTo("AdminCitizensStack")} />
          <StatCard icon="receipt-text" color={C.amber} label="Total Payments" value={(sc.total_payments ?? 0).toLocaleString()} change={sc.total_payments_change} onPress={() => navTo("AdminPaymentsStack")} />
        </ScrollView>

        {/* ── cities + payment methods ─────────────────────────────────── */}
        <View style={styles.row}>
          {/* CITIES */}
          <Panel title="Top Cities by Tax Revenue"
            action={() => navTo("AdminCitiesStack")}
            style={{ flex: 1.05 }}>
            {activeCities.length === 0 ? <NoData /> :
              activeCities.slice(0, 7).map((city, i) => {
                const totalAmt = city.total_slsh > 0
                  ? formatAmount(city.total_slsh, "SLSH")
                  : formatAmount(city.total_usd, "USD");
                return (
                  <Pressable key={city.city} style={styles.cityRow} onPress={() => navTo("AdminCitiesStack")}>
                    <View style={[styles.rankBadge, { backgroundColor: RANK_COLORS[i % RANK_COLORS.length] }]}>
                      <Text style={styles.rankNum}>{String(i + 1).padStart(2, "0")}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.cityTop}>
                        <Text style={styles.cityName}>{city.city}</Text>
                        <Text style={styles.cityAmt}>{totalAmt}</Text>
                      </View>
                      <Bar pct={Math.round(((city.total_slsh + city.total_usd) / maxCity) * 100)}
                           color={RANK_COLORS[i % RANK_COLORS.length]} />
                    </View>
                  </Pressable>
                );
              })}
          </Panel>

          {/* PAYMENT METHODS */}
          <Panel title="Payment Methods"
            action={() => navTo("AdminReportsStack")}
            actionLabel="View Report"
            style={{ flex: 0.95, marginLeft: 10 }}>
            {methods.length === 0 ? <NoData /> : (
              <>
                {/* simple ring showing total */}
                <Pressable style={styles.methodRingWrap} onPress={() => navTo("AdminPaymentsStack")}>
                  {/* Simplified ring: colored sectors using border trick */}
                  <View style={[styles.methodRingOuter, { borderColor: (PAYMENT_METHOD_COLORS[methods[0]?.method] || C.navy) }]}>
                    <Text style={styles.methodRingLbl}>{"Total\nPayments"}</Text>
                    <Text style={styles.methodRingVal}>{totalPmts.toLocaleString()}</Text>
                  </View>
                </Pressable>
                {/* legend */}
                {methods.map((m, i) => {
                  const col = PAYMENT_METHOD_COLORS[m.method] || RANK_COLORS[i];
                  return (
                    <Pressable key={m.method} style={styles.methodLegRow} onPress={() => navTo("AdminPaymentsStack")}>
                      <View style={[styles.legendDot, { backgroundColor: col }]} />
                      <Text style={styles.methodLegLabel}>{formatPaymentMethodLabel(m.method)}</Text>
                      <Text style={styles.methodLegPct}>{m.percentage ?? 0}%</Text>
                      <Text style={styles.methodLegCount}>{(m.count ?? 0).toLocaleString()}</Text>
                    </Pressable>
                  );
                })}
              </>
            )}
          </Panel>
        </View>

        {/* ── currency + tax types ──────────────────────────────────────── */}
        <View style={styles.row}>
          {/* CURRENCY BREAKDOWN */}
          <Panel title="Currency Breakdown" style={{ flex: 1 }}>
            {slshTotal === 0 && usdTotal === 0 ? <NoData /> : (
              <Pressable style={styles.currRow} onPress={() => navTo("AdminReportsStack")}>
                <Ring size={90} pct={slshPct} color={C.navy} label="SLSH"
                  sub={formatAmount(slshTotal, "SLSH")} />
                <Ring size={90} pct={usdPct}  color={C.green} label="USD"
                  sub={formatAmount(usdTotal, "USD")} />
              </Pressable>
            )}
          </Panel>

          {/* TAX TYPES PERFORMANCE */}
          <Panel title="Tax Types Performance"
            action={() => navTo("AdminTaxTypesStack")}
            actionLabel="View Report"
            style={{ flex: 1.15, marginLeft: 10 }}>
            {taxRank.length === 0 ? <NoData /> : (
              <View style={styles.taxGrid}>
                {taxRank.slice(0, 3).map((t, i) => {
                  const COLS3 = [C.navy, C.green, C.violet];
                  const col = COLS3[i % 3];
                  const amtFormatted = t.total_slsh > 0
                    ? formatAmount(t.total_slsh, "SLSH")
                    : t.total_usd > 0
                    ? formatAmount(t.total_usd, "USD")
                    : formatAmount(t.total, "SLSH");
                  return (
                    <Pressable key={t.name} style={[styles.taxCard, { borderTopColor: col }]} onPress={() => navTo("AdminTaxTypesStack")}>
                      <View style={[styles.taxFreqBadge, { backgroundColor: col + "20" }]}>
                        <Icon source="calendar-check" size={10} color={col} />
                        <Text style={[styles.taxFreqTxt, { color: col }]}>
                          {formatFrequencyLabel(t.frequency)}
                        </Text>
                      </View>
                      <Text style={styles.taxName} numberOfLines={2}>{t.name}</Text>
                      <Text style={[styles.taxAmt, { color: col }]}>
                        {amtFormatted}
                      </Text>
                      <Bar pct={t.percentage ?? 0} color={col} />
                      <Text style={styles.taxPct}>{t.percentage ?? 0}% ({t.payment_count ?? 0})</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Panel>
        </View>

        {/* ── revenue trend + payment status ───────────────────────────── */}
        <View style={styles.row}>
          {/* REVENUE OVER TIME */}
          <Panel title="Revenue Over Time" action={() => navTo("AdminReportsStack")} actionLabel="View Report" style={{ flex: 1.2 }}>
            {trend.length === 0 ? <NoData /> : (
              <Pressable style={styles.chartWrap} onPress={() => navTo("AdminReportsStack")}>
                {/* y-axis label */}
                <Text style={styles.yAxisLabel}>Revenue (SLSH)</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.barChart}>
                    {trend.map((t, i) => {
                      const h = Math.max((t.total / maxTrend) * 130, 3);
                      return (
                        <View key={i} style={styles.barCol}>
                          <View style={[styles.barChartBar, { height: h, backgroundColor: C.navy + "CC" }]} />
                          <Text style={styles.barLbl} numberOfLines={1}>
                            {typeof t.month === "string" ? t.month.slice(0, 3) : t.month}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </Pressable>
            )}
          </Panel>

          {/* PAYMENT STATUS */}
          <Panel title="Payment Status"
            action={() => navTo("AdminPaymentsStack")}
            style={{ flex: 0.8, marginLeft: 10 }}>
            {totalPmts === 0 ? <NoData /> : (
              <Pressable onPress={() => navTo("AdminPaymentsStack")}>
                {/* Payment status ring — simple colored border */}
                <View style={{ alignItems: "center", marginBottom: 14 }}>
                  <View style={[styles.statusRingOuter, {
                    borderColor: completed > 0 ? C.green : "#E2E8F0",
                    borderTopColor: C.green,
                    borderRightColor: cPct > 25 ? C.green : "#E2E8F0",
                  }]}>
                    <Text style={styles.statusRingVal}>{totalPmts.toLocaleString()}</Text>
                    <Text style={styles.muted}>Total</Text>
                  </View>
                </View>
                <StatusRow label="Completed" count={completed} pct={cPct} color={C.green} />
                <StatusRow label="Pending"   count={pending}   pct={pPct} color={C.amber} />
                <StatusRow label="Rejected"  count={rejected}  pct={rPct} color={C.red}   />
              </Pressable>
            )}
          </Panel>
        </View>

        {/* ── recent taxpayers / payments ───────────────────────────────── */}
        <View style={styles.panel}>
          {/* tabs */}
          <View style={styles.tabBar}>
            <TabBtn label="Recent Taxpayers" active={activeTab === "taxpayers"} onPress={() => setActiveTab("taxpayers")} />
            <TabBtn label="Recent Payments"  active={activeTab === "payments"}  onPress={() => setActiveTab("payments")}  />
          </View>

          <SearchBar
            placeholder={activeTab === "taxpayers"
              ? "Search by name, TIN, phone…"
              : "Search by name, TIN, reference…"}
            onSearch={text => { setSearchText(text); load(text); }}
          />

          {activeTab === "taxpayers" ? (
            recentCitizens.length === 0 ? (
              <NoData text={searchText ? "No taxpayer found" : "No data available"} />
            ) : (
              <>
                {/* table header */}
                <View style={styles.tableHead}>
                  {["#","Name","TIN Number","Phone","City","Tax Type","Total Paid","Status","Reg. Date"].map(h => (
                    <Text key={h} style={styles.th} numberOfLines={1}>{h}</Text>
                  ))}
                </View>
                {recentCitizens.map((c, i) => {
                  const isActive = (c.status || "").toLowerCase() === "active";
                  return (
                    <Pressable
                      key={c.id || i}
                      style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}
                      onPress={() =>
                        navTo("AdminCitizensStack", {
                          screen: "AdminCitizenDetail",
                          params: { citizenId: c.id },
                        })
                      }
                    >
                      <Text style={styles.td}>{i + 1}</Text>
                      {/* avatar + name */}
                      <View style={styles.tdNameCell}>
                        {c.avatar_url ? (
                          <Image source={{ uri: `${API_ORIGIN}${c.avatar_url}` }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatar, { backgroundColor: RANK_COLORS[i % RANK_COLORS.length] }]}>
                            <Text style={styles.avatarTxt}>
                              {(c.name || c.full_name || "?").charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text style={[styles.td, { color: C.navy, fontWeight: "700" }]} numberOfLines={1}>
                          {c.name || c.full_name || "-"}
                        </Text>
                      </View>
                      <Text style={styles.td} numberOfLines={1}>{c.tin || "-"}</Text>
                      <Text style={styles.td} numberOfLines={1}>{c.phone || "-"}</Text>
                      <Text style={styles.td} numberOfLines={1}>{c.city || "-"}</Text>
                      {/* tax type badge */}
                      <View style={styles.tdCenter}>
                        <Tag text={c.tax_type || "-"} color={C.navy} />
                      </View>
                      <Text style={[styles.td, { fontWeight: "700" }]} numberOfLines={1}>
                        {c.total_paid_formatted
                          || (c.total_paid_slsh != null ? formatAmount(c.total_paid_slsh, "SLSH") : "-")}
                      </Text>
                      {/* status badge */}
                      <View style={styles.tdCenter}>
                        <StatusBadge
                          text={c.status || "-"}
                          bg={isActive ? "#DCFCE7" : "#F1F5F9"}
                          fg={isActive ? C.green : "#64748B"}
                        />
                      </View>
                      <Text style={styles.tdSm} numberOfLines={1}>
                        {c.registered_date || formatDate(c.created_at)}
                      </Text>
                    </Pressable>
                  );
                })}
              </>
            )
          ) : (
            recentPayments.length === 0 ? (
              <NoData text={searchText ? "No payment found" : "No data available"} />
            ) : (
              recentPayments.map(p => (
                <Pressable
                  key={p.id}
                  style={styles.payCard}
                  onPress={() =>
                    navTo("AdminPaymentsStack", {
                      screen: "AdminPaymentForm",
                      params: { paymentId: p.id },
                    })
                  }
                >
                  <View style={styles.payCardHead}>
                    <Text style={styles.payCardName} numberOfLines={1}>
                      {p.citizen_name || "Unknown"}
                    </Text>
                    <StatusBadge
                      text={formatStatusLabel(p.status)}
                      bg={STATUS_COLORS[p.status]?.bg || "#F1F5F9"}
                      fg={STATUS_COLORS[p.status]?.text || "#64748B"}
                    />
                  </View>
                  <Text style={styles.payMeta}>
                    TIN: {p.taxpayer_id || "-"}{p.city ? `  •  ${p.city}` : ""}
                  </Text>
                  <View style={styles.payCardRow}>
                    <Text style={styles.payTax} numberOfLines={1}>{p.tax_type || "-"}</Text>
                    <Text style={styles.payAmt}>{formatAmount(p.amount, p.currency)}</Text>
                  </View>
                  <Text style={styles.payDate}>{formatDate(p.payment_date || p.created_at)}</Text>
                </Pressable>
              ))
            )
          )}

          <Pressable
            style={styles.viewAllRow}
            onPress={() =>
              activeTab === "taxpayers"
                ? navTo("AdminCitizensStack")
                : navTo("AdminPaymentsStack")
            }
          >
            <Text style={styles.viewAllTxt}>
              View all {activeTab === "taxpayers" ? "taxpayers" : "payments"}
            </Text>
            <Icon source="chevron-right" size={16} color={C.navy} />
          </Pressable>
        </View>

        {/* ── system info ───────────────────────────────────────────────── */}
        <View style={styles.sysPanel}>
          <Text style={styles.sysTitleTxt}>System Info</Text>
          <View style={styles.sysGrid}>
            <SysItem icon="account-group" label="Total Users" value={(sc.total_users ?? 0).toLocaleString()} onPress={() => navTo("AdminCitizensStack")} />
            <SysItem icon="receipt" label="Total Payments" value={(sc.total_payments ?? 0).toLocaleString()} onPress={() => navTo("AdminPaymentsStack")} />
            <SysItem icon="database-check" label="Database Status" value={sc.database_status || "-"} valueColor={sc.database_status === "Connected" ? C.green : C.red} onPress={() => navTo("AdminDatabaseStack")} />
            <SysItem icon="backup-restore" label="Last Backup" value={sc.last_backup || "-"} onPress={() => navTo("AdminDatabaseStack")} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, color, label, value, change, onPress }) {
  const up = (change ?? 0) >= 0;
  return (
    <Pressable style={styles.statCard} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: color + "1A" }]}>
        <Icon source={icon} size={22} color={color} />
      </View>
      <Text style={styles.statVal} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.statLbl} numberOfLines={2}>{label}</Text>
      <View style={styles.statTrend}>
        <Icon source={up ? "arrow-up-bold" : "arrow-down-bold"} size={11}
          color={up ? C.green : C.red} />
        <Text style={[styles.statTrendTxt, { color: up ? C.green : C.red }]}>
          {Math.abs(change ?? 0).toFixed(1)}% from last period
        </Text>
      </View>
    </Pressable>
  );
}

function StatusRow({ label, count, pct, color }) {
  return (
    <View style={styles.statusRowWrap}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.statusRowLabel}>{label}</Text>
      <Text style={styles.statusRowCount}>{count.toLocaleString()}</Text>
      <Text style={[styles.statusRowPct, { color }]}>{pct}%</Text>
    </View>
  );
}

function TabBtn({ label, active, onPress }) {
  return (
    <Pressable style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress}>
      <Text style={[styles.tabLbl, active && styles.tabLblActive]}>{label}</Text>
    </Pressable>
  );
}

function SysItem({ icon, label, value, valueColor, onPress }) {
  return (
    <Pressable style={styles.sysItem} onPress={onPress}>
      <Icon source={icon} size={16} color="#64748B" />
      <Text style={styles.sysLabel}>{label}</Text>
      <Text style={[styles.sysValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </Pressable>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: "#F8FAFC" },
  scroll: { padding: 14, paddingBottom: 50 },

  // welcome
  welcomeRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  welcomeH:    { fontSize: 22, fontWeight: "800", color: "#17212B" },
  welcomeSub:  { fontSize: 12, color: "#64748B", marginTop: 1 },
  dbPill:      { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dbDot:       { width: 7, height: 7, borderRadius: 4 },
  dbTxt:       { fontSize: 11, fontWeight: "700" },

  // stat cards
  cardScroll: { marginBottom: 14, marginHorizontal: -14, paddingHorizontal: 14 },
  statCard: {
    backgroundColor: "#FFF", borderRadius: 14, padding: 14, marginRight: 10,
    width: 172, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8,
  },
  statIcon:     { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statVal:      { fontSize: 15, fontWeight: "800", color: "#17212B" },
  statLbl:      { fontSize: 11, color: "#64748B", marginTop: 3, lineHeight: 15 },
  statTrend:    { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 8 },
  statTrendTxt: { fontSize: 10, fontWeight: "700" },

  // panel
  row:        { flexDirection: "row", marginBottom: 14 },
  panel: {
    backgroundColor: "#FFF", borderRadius: 14, padding: 14, marginBottom: 14,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8,
  },
  panelHead:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  panelTitle: { fontSize: 12, fontWeight: "700", color: "#17212B", flex: 1 },
  link:       { fontSize: 11, fontWeight: "700", color: C.navy },

  // cities
  cityRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  rankBadge: { width: 28, height: 28, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  rankNum:   { color: "#FFF", fontSize: 10, fontWeight: "800" },
  cityTop:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  cityName:  { fontSize: 11, fontWeight: "600", color: "#17212B" },
  cityAmt:   { fontSize: 10, fontWeight: "700", color: "#64748B" },

  // payment methods
  methodRingWrap:  { alignItems: "center", marginBottom: 12 },
  methodRingOuter: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 16, borderColor: "#E2E8F0",
    alignItems: "center", justifyContent: "center",
  },
  methodRingSegment: {
    position: "absolute", width: 110, height: 110, borderRadius: 55,
    borderWidth: 16, borderColor: "transparent",
  },
  methodRingInner: { alignItems: "center" },
  methodRingLbl:   { fontSize: 9, color: "#64748B", textAlign: "center" },
  methodRingVal:   { fontSize: 13, fontWeight: "800", color: "#17212B" },
  methodLegRow:    { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 7 },
  methodLegLabel:  { fontSize: 11, flex: 1, color: "#17212B", fontWeight: "600" },
  methodLegPct:    { fontSize: 11, fontWeight: "700", color: "#17212B", marginRight: 4 },
  methodLegCount:  { fontSize: 10, color: "#64748B" },
  legendDot:       { width: 8, height: 8, borderRadius: 4 },

  // currency
  currRow:  { flexDirection: "row", justifyContent: "space-around", paddingVertical: 8 },
  muted:    { fontSize: 10, color: "#64748B" },

  // tax types
  taxGrid: { flexDirection: "row", gap: 8 },
  taxCard: {
    flex: 1, backgroundColor: "#F8FAFC", borderRadius: 10, padding: 10,
    borderTopWidth: 3,
  },
  taxFreqBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2,
    alignSelf: "flex-start", marginBottom: 6,
  },
  taxFreqTxt: { fontSize: 9, fontWeight: "700" },
  taxName:    { fontSize: 10, fontWeight: "700", color: "#17212B", marginBottom: 4 },
  taxAmt:     { fontSize: 11, fontWeight: "800", marginBottom: 6 },
  taxPct:     { fontSize: 9, color: "#64748B", marginTop: 3 },

  // revenue chart
  chartWrap:   { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  yAxisLabel:  { fontSize: 8, color: "#94A3B8", transform: [{ rotate: "-90deg" }], width: 60, textAlign: "center" },
  barChart:    { flexDirection: "row", alignItems: "flex-end", flex: 1, height: 150, gap: 3 },
  barCol:      { flex: 1, alignItems: "center" },
  barChartBar: { width: "80%", borderTopLeftRadius: 3, borderTopRightRadius: 3, minHeight: 3 },
  barLbl:      { fontSize: 8, color: "#94A3B8", marginTop: 4 },

  // payment status ring
  statusRingOuter: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 14, borderColor: "#E2E8F0",
    alignItems: "center", justifyContent: "center",
  },
  statusRingSeg: {
    position: "absolute", width: 100, height: 100, borderRadius: 50,
    borderWidth: 14, borderColor: "transparent",
  },
  statusRingInner: { alignItems: "center" },
  statusRingVal:   { fontSize: 14, fontWeight: "800", color: "#17212B" },
  statusRowWrap:   { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 7 },
  statusRowLabel:  { fontSize: 11, flex: 1, fontWeight: "600", color: "#17212B" },
  statusRowCount:  { fontSize: 11, fontWeight: "700", color: "#17212B" },
  statusRowPct:    { fontSize: 10, fontWeight: "700", minWidth: 34, textAlign: "right" },

  // tabs
  tabBar:       { flexDirection: "row", backgroundColor: "#F1F5F9", borderRadius: 10, padding: 4, marginBottom: 12 },
  tabBtn:       { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 8 },
  tabBtnActive: { backgroundColor: "#FFF", elevation: 1, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4 },
  tabLbl:       { fontSize: 12, fontWeight: "600", color: "#64748B" },
  tabLblActive: { color: C.navy },

  // taxpayers table
  tableHead: {
    flexDirection: "row", backgroundColor: "#F1F5F9",
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 4, marginBottom: 2,
  },
  th:         { flex: 1, fontSize: 9, fontWeight: "700", color: "#64748B", textAlign: "center" },
  tableRow:   { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 4, alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E2E8F0" },
  tableRowAlt: { backgroundColor: "#FAFBFF" },
  td:         { flex: 1, fontSize: 10, color: "#17212B", textAlign: "center" },
  tdSm:       { flex: 1, fontSize: 9, color: "#64748B", textAlign: "center" },
  tdNameCell: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  tdCenter:   { flex: 1, alignItems: "center" },
  avatar:     { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  avatarTxt:  { color: "#FFF", fontSize: 10, fontWeight: "800" },

  // payment cards
  payCard:     { paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E2E8F0" },
  payCardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 3 },
  payCardName: { fontSize: 13, fontWeight: "700", color: "#17212B", flex: 1 },
  payMeta:     { fontSize: 11, color: "#64748B", marginTop: 2 },
  payCardRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4, gap: 8 },
  payTax:      { fontSize: 12, fontWeight: "600", color: "#17212B", flex: 1 },
  payAmt:      { fontSize: 13, fontWeight: "800", color: C.navy },
  payDate:     { fontSize: 10, color: "#9CA3AF", marginTop: 4 },

  // view all
  viewAllRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, marginTop: 12, paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E2E8F0",
  },
  viewAllTxt: { fontSize: 12, fontWeight: "700", color: C.navy },

  // system info
  sysPanel:   { backgroundColor: "#FFF", borderRadius: 14, padding: 14, elevation: 2 },
  sysTitleTxt: { fontSize: 13, fontWeight: "700", color: "#17212B", marginBottom: 12 },
  sysGrid:    { gap: 10 },
  sysItem:    { flexDirection: "row", alignItems: "center", gap: 10 },
  sysLabel:   { fontSize: 12, color: "#64748B", flex: 1 },
  sysValue:   { fontSize: 12, fontWeight: "700", color: "#17212B" },

  // no data
  noData:    { paddingVertical: 28, alignItems: "center", gap: 8 },
  noDataTxt: { fontSize: 12, color: "#94A3B8" },
});
