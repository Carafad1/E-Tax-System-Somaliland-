import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import { ErrorMessage } from "../../components/ErrorMessage";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { extractErrorMessage } from "../../services/api";

export function AdminLoginScreen({ navigation }) {
  const { loginAdmin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (loading) return;
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your administrator username and password.");
      return;
    }

    setLoading(true);
    try {
      await loginAdmin(username.trim(), password);
    } catch (err) {
      setError(extractErrorMessage(err, "Invalid username or password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.primaryGreenDark }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.seal}>
            <Icon source="shield-check-outline" size={40} color={COLORS.primaryGreenDark} />
          </View>
          <Text style={styles.title}>Admin Login</Text>
          <Text style={styles.subtitle}>E-Tax System Somaliland - Admin Dashboard</Text>
        </View>

        <ErrorMessage message={error} />

        <AppInput label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <AppInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />

        <AppButton onPress={handleLogin} loading={loading} style={{ marginTop: 8 }}>
          Login
        </AppButton>

        <AppButton mode="text" textColor={COLORS.primaryLight} onPress={() => {}}>
          Forgot Password?
        </AppButton>

        <AppButton mode="text" textColor={COLORS.white} onPress={() => navigation.goBack()}>
          Back to citizen login
        </AppButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  seal: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.primaryLight,
    marginTop: 4,
    textAlign: "center",
  },
});
