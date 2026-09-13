import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { AppHeader } from "../../components/AppHeader";
import { SomalilandFlag } from "../../components/SomalilandFlag";
import { COLORS } from "../../constants/colors";
import { APP_NAME, APP_SUBTITLE } from "../../constants/config";

export function AboutScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="About" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <SomalilandFlag width={90} height={60} />
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>{APP_SUBTITLE}</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <Section title="About the System">
          A digital tax registration, management and payment platform for citizens and
          businesses in Somaliland, allowing taxpayers to register, view their obligations,
          pay taxes digitally and receive an official, verifiable electronic receipt.
        </Section>

        <Section title="Demonstration Notice">
          This build is a demonstration/student project and is not an officially authorized
          government application unless such authorization has separately been granted.
          Payments processed in this build use a sandbox/mock payment service for development
          purposes only - no real money moves through this app.
        </Section>

        <Section title="Privacy">
          Your personal and financial information is used only to operate your taxpayer
          account and process your tax payments. Passwords and payment PINs are never stored
          in plain text and are never returned by the API.
        </Section>

        <Section title="Terms">
          By using this application you agree to provide accurate registration information
          and to use the digital payment features only for your own lawful tax obligations.
        </Section>

        <Section title="Support">
          For support with this demonstration build, contact your system administrator.
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  appName: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  version: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 8,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primaryGreen,
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
