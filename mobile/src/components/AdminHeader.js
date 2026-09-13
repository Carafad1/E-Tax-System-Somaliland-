import { DrawerActions, useNavigation } from "@react-navigation/native";
import { Appbar } from "react-native-paper";

import { COLORS } from "../constants/colors";

export function AdminHeader({ title, onBack, actions = [] }) {
  const navigation = useNavigation();

  return (
    <Appbar.Header style={{ backgroundColor: COLORS.primaryGreen }} statusBarHeight={0}>
      {onBack ? (
        <Appbar.BackAction color={COLORS.white} onPress={onBack} />
      ) : (
        <Appbar.Action icon="menu" color={COLORS.white} onPress={() => navigation.dispatch(DrawerActions.openDrawer())} />
      )}
      <Appbar.Content title={title} titleStyle={{ color: COLORS.white, fontWeight: "700" }} />
      {actions.map((action, index) => (
        <Appbar.Action key={index} icon={action.icon} color={COLORS.white} onPress={action.onPress} />
      ))}
    </Appbar.Header>
  );
}
