import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";

import { SplashScreen } from "../screens/auth/SplashScreen";
import { useAuth } from "../hooks/useAuth";
import { AuthNavigator } from "./AuthNavigator";
import { CitizenNavigator } from "./CitizenNavigator";
import { AdminNavigator } from "./AdminNavigator";

const MIN_SPLASH_MS = 500;

export function RootNavigator() {
  const { isBootstrapping, isAuthenticated, role } = useAuth();
  const [splashElapsed, setSplashElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  const showSplash = isBootstrapping || !splashElapsed;

  return (
    <NavigationContainer>
      {showSplash ? (
        <SplashScreen />
      ) : !isAuthenticated ? (
        <AuthNavigator />
      ) : role === "admin" ? (
        <AdminNavigator />
      ) : (
        <CitizenNavigator />
      )}
    </NavigationContainer>
  );
}
