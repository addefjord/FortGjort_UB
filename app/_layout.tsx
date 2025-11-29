import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import { AuthProvider } from '../lib/auth-context';
import { DataProvider } from '../lib/data-context';
import { ThemeProvider } from '../lib/theme-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#1A1A1A' }}>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <Stack 
              screenOptions={{ 
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#1A1A1A' },
                gestureEnabled: true,
                gestureDirection: 'horizontal',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
