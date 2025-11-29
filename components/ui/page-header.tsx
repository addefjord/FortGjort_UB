import { StyleSheet, Text, View, ViewProps } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface PageHeaderProps extends ViewProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle, style, ...props }: PageHeaderProps) {
  const colorScheme = useColorScheme();
  
  return (
    <View style={[styles.header, { backgroundColor: Colors[colorScheme].background }, style]} {...props}>
      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: Colors[colorScheme].textMuted }]}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
});
