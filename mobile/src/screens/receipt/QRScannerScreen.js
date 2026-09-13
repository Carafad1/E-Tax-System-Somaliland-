import { useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { AppButton } from "../../components/AppButton";
import { AppHeader } from "../../components/AppHeader";
import { COLORS } from "../../constants/colors";

export function QRScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleScanned = ({ data }) => {
    if (scanned || !data) return;
    setScanned(true);
    navigation.replace("VerifyReceipt", { referenceId: data.trim() });
  };

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <AppHeader title="Scan QR Code" onBack={() => navigation.goBack()} />
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera permission is required to scan a receipt.
          </Text>
          <AppButton style={{ marginTop: 16 }} onPress={requestPermission}>
            Grant Camera Permission
          </AppButton>
          <AppButton
            mode="outlined"
            style={{ marginTop: 10 }}
            onPress={() => navigation.replace("VerifyReceipt")}
          >
            Enter Reference Manually
          </AppButton>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <AppHeader title="Scan Receipt QR Code" onBack={() => navigation.goBack()} />
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleScanned}
      />
      <View style={styles.footer}>
        <AppButton mode="outlined" textColor={COLORS.white} onPress={() => navigation.replace("VerifyReceipt")}>
          Enter Reference Manually
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  permissionText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
  },
});
