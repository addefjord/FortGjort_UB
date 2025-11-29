import { FontAwesome } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useAuth } from '../../lib/auth-context';
import { useData } from '../../lib/data-context';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  const { unreadCount } = useData();
  const isMessages = props.name === 'comments';
  const showBadge = isMessages && unreadCount > 0;
  return (
    <>
      <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />
      {showBadge && (
        <>
          {/* simple absolute badge overlay; Tabs positions icons relatively */}
          <FontAwesome
            name="circle"
            color="#ff3b30"
            size={12}
            style={{ position: 'absolute', right: -2, top: -2 }}
          />
        </>
      )}
    </>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/login');
    }
  }, [loading, user]);

  return (
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingTop: 10,
          height: 85,
          position: 'absolute',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarBackground: () => (
          <View style={{
            flex: 1,
            backgroundColor: Colors[colorScheme].background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: Colors[colorScheme].border,
          }} />
        ),
        tabBarLabelStyle: {
          fontWeight: '500',
          paddingBottom: 5,
        },
        animation: 'shift',
        // Header hidden (we render our own large titles inside screens)
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Utforsk',
          tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mine-jobber"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="ny-jobb"
        options={{
          title: 'Legg ut',
          tabBarIcon: ({ color }) => <TabBarIcon name="plus-circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="meldinger"
        options={{
          title: 'Meldinger',
          tabBarIcon: ({ color }) => <TabBarIcon name="comments" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
      </Tabs>
  );
}
