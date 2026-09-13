import { StyleSheet, View } from "react-native";

import { COLORS } from "../constants/colors";

export function StackedBar({ segments, height = 14 }) {
  const total = segments.reduce((sum, s) => sum + (s.value || 0), 0) || 1;

  return (
    <View style={[styles.track, { height }]}>
      {segments
        .filter((s) => s.value > 0)
        .map((s, index) => (
          <View
            key={`${s.label}-${index}`}
            style={{ flex: s.value / total, backgroundColor: s.color, height }}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: COLORS.lightGray,
    width: "100%",
  },
});
