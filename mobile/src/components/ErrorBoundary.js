import { Component } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import { AppButton } from "./AppButton";
import { COLORS } from "../constants/colors";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught error:", error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconWrap}>
              <Icon source="shield-alert-outline" size={48} color={COLORS.primaryGreen} />
            </View>
            <Text style={styles.title}>E-Tax System Somaliland</Text>
            <Text style={styles.subtitle}>System Recovery Mode</Text>
            <Text style={styles.message}>
              An unexpected error occurred, but the system recovered safely.
            </Text>
            {__DEV__ && !!this.state.error && (
              <Text style={styles.debugText}>{String(this.state.error?.message || this.state.error)}</Text>
            )}
            <AppButton style={{ marginTop: 24, width: "100%" }} onPress={this.handleReset}>
              Reload App & Continue
            </AppButton>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primaryGreen,
    marginTop: 2,
    marginBottom: 12,
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  debugText: {
    fontSize: 10,
    color: COLORS.danger,
    marginTop: 10,
    textAlign: "center",
  },
});
