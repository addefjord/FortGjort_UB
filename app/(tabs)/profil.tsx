import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/themed-text';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useAuth } from '../../lib/auth-context';
import { useData } from '../../lib/data-context';
import { useTheme } from '../../lib/theme-context';

export default function ProfilePage() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const { reset } = useData();
  const { theme, setTheme } = useTheme();
  const colorScheme = useColorScheme();

  const handleSignOut = () => {
    Alert.alert(
      'Logg ut',
      'Er du sikker på at du vil logge ut?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Logg ut',
          style: 'destructive',
          onPress: async () => {
            try {
              setSigningOut(true);
              await signOut();
              // Clear cached data after successful sign-out
              reset();
            } catch (e) {
              const message = e instanceof Error ? e.message : 'Ukjent feil';
              Alert.alert('Kunne ikke logge ut', message);
            } finally {
              setSigningOut(false);
            }
          }
        }
      ]
    );
  };

  const handleThemeChange = () => {
    Alert.alert(
      'Velg tema',
      'Hvilket tema vil du bruke?',
      [
        {
          text: 'Lys',
          onPress: () => setTheme('light'),
        },
        {
          text: 'Mørk',
          onPress: () => setTheme('dark'),
        },
        {
          text: 'System',
          onPress: () => setTheme('system'),
        },
        {
          text: 'Avbryt',
          style: 'cancel',
        },
      ]
    );
  };

  const getThemeLabel = () => {
    if (theme === 'system') return 'System';
    if (theme === 'light') return 'Lys';
    return 'Mørk';
  };

  const menuItems = [
    {
      icon: 'user' as const,
      title: 'Rediger profil',
      onPress: () => console.log('Rediger profil'),
    },
    {
      icon: 'star' as const,
      title: 'Vurderinger',
      onPress: () => console.log('Vurderinger'),
    },
    {
      icon: 'credit-card' as const,
      title: 'Betalingshistorikk',
      onPress: () => console.log('Betalinger'),
    },
    {
      icon: 'adjust' as const,
      title: 'Utseende',
      subtitle: getThemeLabel(),
      onPress: handleThemeChange,
    },
    {
      icon: 'cog' as const,
      title: 'Innstillinger',
      onPress: () => console.log('Innstillinger'),
    },
    {
      icon: 'question-circle' as const,
      title: 'Hjelp',
      onPress: () => console.log('Hjelp'),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['top']}>
      <View style={[styles.headerSection, { backgroundColor: Colors[colorScheme].background }]}>
        <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Konto</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.profileCard, { backgroundColor: Colors[colorScheme].cardElevated }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: Colors[colorScheme].card }]}>
              <FontAwesome name="user" size={40} color={Colors[colorScheme].textMuted} />
            </View>
          </View>
          <Text style={[styles.name, { color: Colors[colorScheme].text }]}>{user?.email || 'Bruker'}</Text>
          <Text style={[styles.subtitle, { color: Colors[colorScheme].textMuted }]}>Medlem siden oktober 2023</Text>
        </View>

        <View style={[styles.statsCard, { backgroundColor: Colors[colorScheme].cardElevated }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: Colors[colorScheme].tint }]}>4.8</Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme].textMuted }]}>Vurdering</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: Colors[colorScheme].border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: Colors[colorScheme].tint }]}>12</Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme].textMuted }]}>Fullførte</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: Colors[colorScheme].border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: Colors[colorScheme].tint }]}>5</Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme].textMuted }]}>Pågående</Text>
          </View>
        </View>

        <View style={[styles.menu, { backgroundColor: Colors[colorScheme].cardElevated }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { borderBottomColor: Colors[colorScheme].border }]}
              onPress={item.onPress}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: Colors[colorScheme].card }]}>
                <FontAwesome name={item.icon} size={20} color={Colors[colorScheme].tint} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuText, { color: Colors[colorScheme].text }]}>{item.title}</Text>
                {item.subtitle && <Text style={[styles.menuSubtitle, { color: Colors[colorScheme].textMuted }]}>{item.subtitle}</Text>}
              </View>
              <FontAwesome name="chevron-right" size={16} color={Colors[colorScheme].textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[
            styles.signOutButton, 
            { 
              backgroundColor: Colors[colorScheme].cardElevated,
              borderColor: colorScheme === 'dark' ? '#3F1F1F' : '#ffcdd2'
            },
            signingOut && { opacity: 0.6 }
          ]} 
          onPress={handleSignOut} 
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator size="small" color="#ff6b6b" style={styles.signOutIcon} />
          ) : (
            <FontAwesome name="sign-out" size={20} color="#ff6b6b" style={styles.signOutIcon} />
          )}
          <Text style={styles.signOutText}>{signingOut ? 'Logger ut…' : 'Logg ut'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  statDivider: {
    width: 1,
  },
  menu: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
  },
  menuSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  signOutButton: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
  },
});