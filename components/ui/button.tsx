import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', loading, children, style, disabled, ...props }: ButtonProps) {
  const colorScheme = useColorScheme();
  const variantStyle = variant === 'primary' ? styles.primary : variant === 'secondary' ? styles.secondary : styles.outline;
  const textStyle = variant === 'outline' ? styles.outlineText : styles.text;

  return (
    <TouchableOpacity
      style={[styles.button, variantStyle, (disabled || loading) && styles.disabled, style]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' ? Colors[colorScheme].tint : '#FFFFFF'} />
      ) : typeof children === 'string' ? (
        <Text style={[styles.text, textStyle, { color: variant === 'outline' ? Colors[colorScheme].tint : '#FFFFFF' }]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    minHeight: 48,
  },
  primary: {
    backgroundColor: Colors.light.tint,
  },
  secondary: {
    backgroundColor: '#2A2A2A',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  outlineText: {
    color: Colors.light.tint,
  },
});
