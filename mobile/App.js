import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";

import { AuthProvider } from "./src/context/AuthContext";
import { LocalizationProvider } from "./src/context/LocalizationContext";
import { OfflineBanner } from "./src/components/OfflineBanner";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { paperTheme } from "./src/theme/theme";

// Register global crash prevention handler so unhandled JS errors never trigger Expo's blue crash screen
if (global.ErrorUtils) {
  const previousHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.warn("Global exception intercepted safely:", error);
    if (previousHandler && __DEV__) {
      previousHandler(error, isFatal);
    }
  });
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PaperProvider theme={paperTheme}>
            <LocalizationProvider>
              <AuthProvider>
                <StatusBar style="light" />
                <OfflineBanner />
                <RootNavigator />
              </AuthProvider>
            </LocalizationProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
