import { StyleSheet, View, ViewProps } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface CardProps extends ViewProps {
  elevated?: boolean;
}

export function Card({ elevated = false, style, children, ...props }: CardProps) {
  const colorScheme = useColorScheme();
  
  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: elevated 
            ? Colors[colorScheme].cardElevated 
            : Colors[colorScheme].card 
        },
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});

