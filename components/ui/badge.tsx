import { StyleSheet, Text, View, ViewProps } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface BadgeProps extends ViewProps {
  count: number;
  max?: number;
}

export function Badge({ count, max = 99, style, ...props }: BadgeProps) {
  const colorScheme = useColorScheme();
  
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <View style={[styles.badge, { backgroundColor: Colors[colorScheme].error }, style]} {...props}>
      <Text style={styles.text}>{displayCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
