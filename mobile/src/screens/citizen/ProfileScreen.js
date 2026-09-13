import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Dialog, Divider, Icon, Menu, Portal, Text } from "react-native-paper";

import { AppButton } from "../../components/AppButton";
import { AppHeader } from "../../components/AppHeader";
import { ErrorMessage } from "../../components/ErrorMessage";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { API_ORIGIN } from "../../constants/config";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { extractErrorMessage } from "../../services/api";
import { removeAvatar, uploadAvatar } from "../../services/profileService";

const AVATAR_MAX_DIMENSION = 800;

export function ProfileScreen({ navigation }) {
  const { user, refreshUser, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const avatarUri = user?.avatar_url
    ? user.avatar_url.startsWith("file:") ||
      user.avatar_url.startsWith("http") ||
      user.avatar_url.startsWith("content:") ||
      user.avatar_url.startsWith("data:")
      ? user.avatar_url
      : `${API_ORIGIN}${user.avatar_url}`
    : null;

  const pickImage = async (fromCamera) => {
    setMenuVisible(false);
    setError("");

    try {
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setError(
          fromCamera
            ? "Camera access is required to take a profile photo. Please allow it in your phone's Settings."
            : "Photo library permission is required to select a profile picture."
        );
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setPreviewAsset({
        uri: asset.uri,
        fileName: asset.fileName || asset.uri.split("/").pop() || "avatar.jpg",
      });
    } catch (err) {
      setError(extractErrorMessage(err, "Unable to select photo. Please try again."));
    }
  };

  const handleConfirmUpload = async () => {
    if (!previewAsset || uploading) return;
    setUploading(true);
    setError("");
    try {
      let finalUri = previewAsset.uri;
      try {
        const resized = await manipulateAsync(
          previewAsset.uri,
          [{ resize: { width: AVATAR_MAX_DIMENSION } }],
          { compress: 0.7, format: SaveFormat.JPEG }
        );
        finalUri = resized.uri;
      } catch (_manipErr) {
        // Fallback to original uri if manipulator fails
      }

      const fileName = previewAsset.fileName ? previewAsset.fileName.replace(/\.[^/.]+$/, "") + ".jpg" : "avatar.jpg";
      const data = await uploadAvatar(finalUri, fileName, "image/jpeg");
      const updatedUrl = data?.avatar_url || data?.user?.avatar_url || finalUri;

      refreshUser({ ...user, avatar_url: updatedUrl });
      setPreviewAsset(null);
    } catch (err) {
      // If the upload never reached the server, the profile must not
      // silently change on screen - show the real error instead.
      setError(extractErrorMessage(err, "Unable to upload photo. Please try again."));
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPreview = () => {
    if (uploading) return;
    setPreviewAsset(null);
  };

  const handleRemove = async () => {
    if (uploading) return;
    setMenuVisible(false);
    setError("");
    setUploading(true);
    try {
      await removeAvatar();
      refreshUser({ ...user, avatar_url: null });
    } catch (err) {
      setError(extractErrorMessage(err, "Unable to remove photo. Please try again."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Taxpayer Profile" actions={[{ icon: "cog-outline", onPress: () => navigation.navigate("Settings") }]} />
      <ScrollView contentContainerStyle={styles.container}>
        <ErrorMessage message={error} />

        <View style={styles.avatarWrap}>
          <View style={styles.avatarBox}>
            <View style={styles.avatar}>
              {uploading && !previewAsset ? (
                <ActivityIndicator color={COLORS.white} />
              ) : avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Icon source="account" size={40} color={COLORS.white} />
              )}
            </View>

            <View style={styles.editBadgeWrapper}>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Pressable style={styles.editBadge} onPress={() => setMenuVisible(true)} disabled={uploading}>
                    <Icon source="camera" size={18} color={COLORS.primaryGreen} />
                  </Pressable>
                }
              >
                <Menu.Item leadingIcon="camera-outline" onPress={() => pickImage(true)} title="Take Photo" />
                <Menu.Item leadingIcon="image-outline" onPress={() => pickImage(false)} title={avatarUri ? "Change Photo" : "Choose from Gallery"} />
                {avatarUri && <Menu.Item leadingIcon="delete-outline" onPress={handleRemove} title="Remove Photo" />}
              </Menu>
            </View>
          </View>

          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.status}>{(user?.status || "ACTIVE").toUpperCase()}</Text>
        </View>

        <View style={styles.card}>
          <Row label="Taxpayer ID/TIN" value={user?.tin} />
          <Row label="Phone" value={user?.phone} />
          <Row label="Email" value={user?.email || "-"} />
          <Row label="ID Number" value={user?.id_number || "-"} />
          <Row label="City" value={user?.city || "-"} />
          <Row label="Address" value={user?.address || "-"} />
          <Row label="Occupation" value={user?.occupation || "-"} />
          <Row label="Taxpayer Type" value={user?.taxpayer_type} />
          {user?.business_name ? <Row label="Business Name" value={user.business_name} /> : null}
          {user?.business_type ? <Row label="Business Type" value={user.business_type} /> : null}
          <Row label="Registration Date" value={user?.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10)} last />
        </View>

        <AppButton style={{ marginTop: 20 }} onPress={() => navigation.navigate("EditProfile")}>
          Edit Profile
        </AppButton>
        <AppButton
          mode="outlined"
          style={{ marginTop: 10 }}
          onPress={() => navigation.navigate("SetPaymentPin")}
        >
          {user?.has_payment_pin ? "Change Payment PIN" : "Set Payment PIN"}
        </AppButton>
        <AppButton mode="text" textColor={COLORS.danger} style={{ marginTop: 4 }} onPress={logout}>
          Logout
        </AppButton>
      </ScrollView>

      <Portal>
        <Dialog visible={!!previewAsset} onDismiss={handleCancelPreview}>
          <Dialog.Title>Preview Photo</Dialog.Title>
          <Dialog.Content>
            {previewAsset && (
              <Image source={{ uri: previewAsset.uri }} style={styles.previewImage} resizeMode="cover" />
            )}
            {uploading && <LoadingSpinner label="Uploading..." />}
          </Dialog.Content>
          <Dialog.Actions>
            <AppButton mode="text" onPress={handleCancelPreview} disabled={uploading}>
              Cancel
            </AppButton>
            <AppButton mode="text" onPress={handleConfirmUpload} loading={uploading} disabled={uploading}>
              Save
            </AppButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

function Row({ label, value, last }) {
  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      {!last && <Divider />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarBox: {
    width: 76,
    height: 76,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 76,
    height: 76,
  },
  editBadgeWrapper: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
  },
  editBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primaryGreen,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  name: {
    fontSize: 17,
    fontWeight: "800",
    marginTop: 10,
    color: COLORS.textPrimary,
  },
  status: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: "700",
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
  },
  rowLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  rowValue: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
    textTransform: "capitalize",
  },
  previewImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
  },
});
