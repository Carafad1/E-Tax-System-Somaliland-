import { StyleSheet } from "react-native";
import { Card } from "react-native-paper";

export function AppCard({ children, style, onPress }) {
  return (
    <Card style={[styles.card, style]} onPress={onPress} mode="elevated">
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginBottom: 12,
  },
});
