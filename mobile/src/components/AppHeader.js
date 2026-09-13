import { Appbar } from "react-native-paper";

import { COLORS } from "../constants/colors";

export function AppHeader({ title, onBack, actions = [] }) {
  return (
    <Appbar.Header style={{ backgroundColor: COLORS.primaryGreen }} statusBarHeight={0}>
      {onBack ? <Appbar.BackAction color={COLORS.white} onPress={onBack} /> : null}
      <Appbar.Content title={title} titleStyle={{ color: COLORS.white, fontWeight: "700" }} />
      {actions.map((action, index) => (
        <Appbar.Action key={index} icon={action.icon} color={COLORS.white} onPress={action.onPress} />
      ))}
    </Appbar.Header>
  );
}
