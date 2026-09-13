import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { COLORS } from "../constants/colors";

export function MiniBarChart({ data, color = COLORS.primaryGreen, height = 160 }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={[styles.wrap, { height }]}>
      {data.map((d, index) => {
        const barHeight = Math.max((d.value / maxValue) * (height - 26), 3);
        return (
          <View key={`${d.label}-${index}`} style={styles.column}>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { height: barHeight, backgroundColor: color }]} />
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
    alignItems: "center",
  },
  barTrack: {
    flex: 1,
    justifyContent: "flex-end",
    width: "60%",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 3,
  },
  label: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
});
