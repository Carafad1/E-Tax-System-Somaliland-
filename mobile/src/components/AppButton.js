import { Button } from "react-native-paper";

export function AppButton({
  children,
  onPress,
  mode = "contained",
  loading = false,
  disabled = false,
  style,
  icon,
  ...rest
}) {
  return (
    <Button
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled || loading}
      icon={icon}
      style={[{ borderRadius: 10 }, style]}
      contentStyle={{ paddingVertical: 6 }}
      {...rest}
    >
      {children}
    </Button>
  );
}
