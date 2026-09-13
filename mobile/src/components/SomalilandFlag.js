import { StyleSheet, Text, View } from "react-native";
import Svg, { Polygon } from "react-native-svg";

/**
 * The Somaliland flag: three equal horizontal bands - green (top), white
 * (middle, carrying the black Shahada and a black five-pointed star), red
 * (bottom). This is intentionally NOT the Somalia flag (plain light-blue
 * field with a single white star).
 */
export function SomalilandFlag({ width = 120, height = 80, showText = true }) {
  const starSize = height * 0.28;

  return (
    <View style={[styles.container, { width, height, borderColor: "#00000022" }]}>
      <View style={[styles.band, { backgroundColor: "#0B6E4F" }]} />
      <View style={[styles.band, styles.middleBand, { backgroundColor: "#FFFFFF" }]}>
        <Svg width={starSize} height={starSize} viewBox="0 0 24 24">
          <Polygon
            points="12,1 15,9 23,9 16.5,14 19,22 12,17 5,22 7.5,14 1,9 9,9"
            fill="#000000"
          />
        </Svg>
        {showText && height > 50 ? (
          <Text style={[styles.shahada, { fontSize: Math.max(height * 0.11, 8) }]}>
            لا إله إلا الله محمد رسول الله
          </Text>
        ) : null}
      </View>
      <View style={[styles.band, { backgroundColor: "#C8102E" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  band: {
    flex: 1,
  },
  middleBand: {
    alignItems: "center",
    justifyContent: "center",
  },
  shahada: {
    color: "#000000",
    marginTop: 2,
    textAlign: "center",
  },
});
