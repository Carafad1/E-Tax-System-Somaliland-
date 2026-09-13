import { View } from "react-native";
import { HelperText, TextInput } from "react-native-paper";

export function AppInput({ label, value, onChangeText, error, style, ...rest }) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      <TextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={onChangeText}
        error={!!error}
        {...rest}
      />
      {!!error && <HelperText type="error">{error}</HelperText>}
    </View>
  );
}
