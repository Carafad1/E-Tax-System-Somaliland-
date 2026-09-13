import {
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Icon, Text } from "react-native-paper";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#06297E" />

      {/* Royal Blue Gradient Background */}
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#0735A4" />
            <Stop offset="50%" stopColor="#062E8A" />
            <Stop offset="100%" stopColor="#041F61" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#blueGradient)" />
      </Svg>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Top 3D Somaliland Map */}
          <View style={styles.mapContainer}>
            <Image
              source={require("../../../assets/somaliland_map_3d.png")}
              style={styles.mapImage}
              resizeMode="contain"
            />
          </View>

          {/* Middle Typography & Emblem */}
          <View style={styles.centerSection}>
            {/* White Scales Emblem */}
            <View style={styles.emblemWrapper}>
              <View style={styles.emblemCircle}>
                <Icon source="scale-balance" size={36} color="#FFFFFF" />
              </View>
            </View>

            {/* WELCOME TO */}
            <View style={styles.subHeaderRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.starIcon}>★</Text>
              <Text style={styles.welcomeText}>WELCOME TO</Text>
              <Text style={styles.starIcon}>★</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* E-TAX Title */}
            <Text style={styles.mainTitle}>E-TAX</Text>

            {/* SYSTEM */}
            <View style={styles.subHeaderRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.starIcon}>★</Text>
              <Text style={styles.systemText}>SYSTEM</Text>
              <Text style={styles.starIcon}>★</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* SOMALILAND */}
            <Text style={styles.somalilandText}>SOMALILAND</Text>
          </View>

          {/* Bottom Get Started Button - Navigates directly to Login */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.getStartedBtn}
              onPress={() => navigation.navigate("Login")}
            >
              <View style={styles.arrowCircle}>
                <Icon source="arrow-right" size={20} color="#062E8A" />
              </View>
              <Text style={styles.btnText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#062E8A",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: SCREEN_HEIGHT * 0.04,
    paddingBottom: SCREEN_HEIGHT * 0.05,
  },
  mapContainer: {
    width: SCREEN_WIDTH * 0.88,
    height: SCREEN_HEIGHT * 0.28,
    alignItems: "center",
    justifyContent: "center",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  centerSection: {
    alignItems: "center",
    width: "100%",
    marginVertical: 10,
  },
  emblemWrapper: {
    marginBottom: 16,
  },
  emblemCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  subHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  dividerLine: {
    width: 40,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  starIcon: {
    color: "#FFFFFF",
    fontSize: 10,
    marginHorizontal: 6,
  },
  welcomeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3,
  },
  mainTitle: {
    color: "#FFFFFF",
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: 4,
    marginVertical: -2,
    textAlign: "center",
  },
  systemText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 6,
  },
  somalilandText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 7,
    marginTop: 8,
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
  },
  getStartedBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    width: "88%",
    height: 58,
    borderRadius: 30,
    paddingHorizontal: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EBF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    flex: 1,
    textAlign: "center",
    color: "#062E8A",
    fontSize: 18,
    fontWeight: "800",
    marginRight: 44,
  },
});
