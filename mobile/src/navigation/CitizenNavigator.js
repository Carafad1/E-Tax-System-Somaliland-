import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Icon } from "react-native-paper";

import { COLORS } from "../constants/colors";

import { DashboardScreen } from "../screens/citizen/DashboardScreen";
import { NotificationsScreen } from "../screens/citizen/NotificationsScreen";
import { SettingsScreen } from "../screens/citizen/SettingsScreen";
import { AboutScreen } from "../screens/citizen/AboutScreen";
import { ProfileScreen } from "../screens/citizen/ProfileScreen";
import { EditProfileScreen } from "../screens/citizen/EditProfileScreen";
import { SetPaymentPinScreen } from "../screens/citizen/SetPaymentPinScreen";
import { MyTaxesScreen } from "../screens/citizen/MyTaxesScreen";

import { PayTaxScreen } from "../screens/payment/PayTaxScreen";
import { PaymentReviewScreen } from "../screens/payment/PaymentReviewScreen";
import { PaymentResultScreen } from "../screens/payment/PaymentResultScreen";
import { PaymentHistoryScreen } from "../screens/payment/PaymentHistoryScreen";

import { ReceiptsListScreen } from "../screens/receipt/ReceiptsListScreen";
import { ReceiptScreen } from "../screens/receipt/ReceiptScreen";
import { VerifyReceiptScreen } from "../screens/receipt/VerifyReceiptScreen";
import { QRScannerScreen } from "../screens/receipt/QRScannerScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = { headerShown: false };

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="ReceiptDetail" component={ReceiptScreen} />
      <Stack.Screen name="VerifyReceipt" component={VerifyReceiptScreen} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} />
    </Stack.Navigator>
  );
}

function TaxesStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MyTaxes" component={MyTaxesScreen} />
      <Stack.Screen name="SetPaymentPin" component={SetPaymentPinScreen} />
      <Stack.Screen name="PayTax" component={PayTaxScreen} />
      <Stack.Screen name="PaymentReview" component={PaymentReviewScreen} />
      <Stack.Screen name="PaymentResult" component={PaymentResultScreen} />
      <Stack.Screen name="ReceiptDetail" component={ReceiptScreen} />
    </Stack.Navigator>
  );
}

function PaymentsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
      <Stack.Screen name="ReceiptDetail" component={ReceiptScreen} />
    </Stack.Navigator>
  );
}

function ReceiptsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ReceiptsList" component={ReceiptsListScreen} />
      <Stack.Screen name="ReceiptDetail" component={ReceiptScreen} />
      <Stack.Screen name="VerifyReceipt" component={VerifyReceiptScreen} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="SetPaymentPin" component={SetPaymentPinScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

const TAB_ICONS = {
  HomeTab: "view-dashboard-outline",
  TaxesTab: "file-percent-outline",
  PaymentsTab: "cash-multiple",
  ReceiptsTab: "receipt",
  ProfileTab: "account-outline",
};

export function CitizenNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primaryGreen,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarIcon: ({ color, size }) => (
          <Icon source={TAB_ICONS[route.name]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="TaxesTab" component={TaxesStack} options={{ tabBarLabel: "My Taxes" }} />
      <Tab.Screen name="PaymentsTab" component={PaymentsStack} options={{ tabBarLabel: "Payments" }} />
      <Tab.Screen name="ReceiptsTab" component={ReceiptsStack} options={{ tabBarLabel: "Receipts" }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: "Profile" }} />
    </Tab.Navigator>
  );
}
