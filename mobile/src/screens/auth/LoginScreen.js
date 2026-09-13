import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import { AuthHeroHeader } from "../../components/AuthHeroHeader";
import { ErrorMessage } from "../../components/ErrorMessage";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { extractErrorMessage } from "../../services/api";

export function LoginScreen({ navigation }) {
  const { loginCitizen } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (loading) return;
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter your phone/email and password.");
      return;
    }

    setLoading(true);
    try {
      await loginCitizen(identifier.trim(), password);
    } catch (err) {
      setError(extractErrorMessage(err, "Invalid phone/email or password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.white }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AuthHeroHeader title="Welcome Back" subtitle="Login to your account" compact />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ErrorMessage message={error} />

        <AppInput
          label="Phone or Email"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <AppInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />

        <AppButton onPress={handleLogin} loading={loading} style={{ marginTop: 8 }}>
          Login
        </AppButton>

        <AppButton mode="text" onPress={() => {}}>
          Forgot Password
        </AppButton>

        <View style={styles.footerRow}>
          <Text>Don't have an account? </Text>
          <Text style={styles.link} onPress={() => navigation.navigate("Register")}>
            Register Now
          </Text>
        </View>

        <View style={styles.adminSection}>
          <AppButton
            mode="outlined"
            icon="shield-account"
            textColor={COLORS.primary}
            onPress={() => navigation.navigate("AdminLogin")}
          >
            Admin Dashboard Login
          </AppButton>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  link: {
    color: COLORS.primaryGreen,
    fontWeight: "700",
  },
  adminSection: {
    marginTop: 24,
    marginBottom: 16,
  },
});
