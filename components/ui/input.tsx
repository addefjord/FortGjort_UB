import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const colorScheme = useColorScheme();
  
  return (
    <View>
      {label && <Text style={[styles.label, { color: Colors[colorScheme].text }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input, 
          { 
            backgroundColor: Colors[colorScheme].input,
            borderColor: error ? Colors[colorScheme].error : Colors[colorScheme].inputBorder,
            color: Colors[colorScheme].text,
          },
          style
        ]}
        placeholderTextColor={Colors[colorScheme].textMuted}
        {...props}
      />
      {error && <Text style={[styles.error, { color: Colors[colorScheme].error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
