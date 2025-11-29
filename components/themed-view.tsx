import { useColorScheme, View, ViewProps } from 'react-native';
import Colors from '../constants/Colors';

export function ThemedView(props: ViewProps) {
  const colorScheme = useColorScheme();
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        props.style,
      ]}
    />
  );
}