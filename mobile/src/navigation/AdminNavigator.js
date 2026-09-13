import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AdminDrawerContent } from "../components/AdminDrawerContent";

import { AdminDashboardScreen } from "../screens/admin/AdminDashboardScreen";
import { AdminCitizensScreen } from "../screens/admin/AdminCitizensScreen";
import { AdminCitizenFormScreen } from "../screens/admin/AdminCitizenFormScreen";
import { AdminCitizenDetailScreen } from "../screens/admin/AdminCitizenDetailScreen";
import { AdminPaymentsScreen } from "../screens/admin/AdminPaymentsScreen";
import { AdminPaymentFormScreen } from "../screens/admin/AdminPaymentFormScreen";
import { AdminTaxTypesScreen } from "../screens/admin/AdminTaxTypesScreen";
import { AdminTaxTypeFormScreen } from "../screens/admin/AdminTaxTypeFormScreen";
import { AdminCitiesScreen } from "../screens/admin/AdminCitiesScreen";
import { AdminCityFormScreen } from "../screens/admin/AdminCityFormScreen";
import { AdminReceiptsScreen } from "../screens/admin/AdminReceiptsScreen";
import { AdminReportsScreen } from "../screens/admin/AdminReportsScreen";
import { AdminDatabaseScreen } from "../screens/admin/AdminDatabaseScreen";
import { AdminAuditLogsScreen } from "../screens/admin/AdminAuditLogsScreen";
import { AdminSettingsScreen } from "../screens/admin/AdminSettingsScreen";
import { ReceiptScreen } from "../screens/receipt/ReceiptScreen";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();
const screenOptions = { headerShown: false };

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    </Stack.Navigator>
  );
}

function CitizensStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminCitizens" component={AdminCitizensScreen} />
      <Stack.Screen name="AdminCitizenDetail" component={AdminCitizenDetailScreen} />
      <Stack.Screen name="AdminCitizenForm" component={AdminCitizenFormScreen} />
    </Stack.Navigator>
  );
}

function PaymentsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminPayments" component={AdminPaymentsScreen} />
      <Stack.Screen name="AdminPaymentForm" component={AdminPaymentFormScreen} />
      <Stack.Screen name="AdminReceiptDetail" component={ReceiptScreen} />
    </Stack.Navigator>
  );
}

function TaxTypesStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminTaxTypes" component={AdminTaxTypesScreen} />
      <Stack.Screen name="AdminTaxTypeForm" component={AdminTaxTypeFormScreen} />
    </Stack.Navigator>
  );
}

function CitiesStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminCities" component={AdminCitiesScreen} />
      <Stack.Screen name="AdminCityForm" component={AdminCityFormScreen} />
    </Stack.Navigator>
  );
}

function ReceiptsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminReceipts" component={AdminReceiptsScreen} />
      <Stack.Screen name="AdminReceiptDetail" component={ReceiptScreen} />
    </Stack.Navigator>
  );
}

function ReportsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
    </Stack.Navigator>
  );
}

function DatabaseStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminDatabase" component={AdminDatabaseScreen} />
    </Stack.Navigator>
  );
}

function AuditLogsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminAuditLogs" component={AdminAuditLogsScreen} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
    </Stack.Navigator>
  );
}

export function AdminNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false, drawerType: "front" }}
      drawerContent={(props) => <AdminDrawerContent {...props} />}
    >
      <Drawer.Screen name="AdminDashboardStack" component={DashboardStack} options={{ title: "Dashboard" }} />
      <Drawer.Screen name="AdminCitizensStack" component={CitizensStack} options={{ title: "Citizens" }} />
      <Drawer.Screen name="AdminPaymentsStack" component={PaymentsStack} options={{ title: "Payments" }} />
      <Drawer.Screen name="AdminTaxTypesStack" component={TaxTypesStack} options={{ title: "Tax Types" }} />
      <Drawer.Screen name="AdminCitiesStack" component={CitiesStack} options={{ title: "Cities" }} />
      <Drawer.Screen name="AdminReceiptsStack" component={ReceiptsStack} options={{ title: "Receipts" }} />
      <Drawer.Screen name="AdminReportsStack" component={ReportsStack} options={{ title: "Reports" }} />
      <Drawer.Screen name="AdminDatabaseStack" component={DatabaseStack} options={{ title: "Database Management" }} />
      <Drawer.Screen name="AdminAuditLogsStack" component={AuditLogsStack} options={{ title: "Audit Logs" }} />
      <Drawer.Screen name="AdminSettingsStack" component={SettingsStack} options={{ title: "Settings" }} />
    </Drawer.Navigator>
  );
}
