import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, StyleSheet, Switch, TextInput, TouchableOpacity, View, ViewToken } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import Colors from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { vippsAuth } from '../../lib/vipps-auth';

const { width } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: '1',
    icon: 'search',
    title: 'Finn jobber',
    description: 'Bla gjennom hundrevis av småjobber i ditt nærområde. Fra hagearbeid til flyttehjelp.',
  },
  {
    id: '2',
    icon: 'plus-circle',
    title: 'Legg ut jobber',
    description: 'Trenger du hjelp? Legg ut en jobb på få sekunder og få tilbud fra kvalifiserte folk.',
  },
  {
    id: '3',
    icon: 'handshake-o',
    title: 'Koble sammen',
    description: 'Chat direkte med arbeidsgivere eller arbeidstakere. Bli enige om tid og pris.',
  },
  {
    id: '4',
    icon: 'money',
    title: 'Få betalt trygt',
    description: 'Sikker betaling gjennom appen. Vipps-integrasjon for rask utbetaling.',
  },
];

export default function Login() {
  const insets = useSafeAreaInsets();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleVippsLogin = async () => {
    try {
      await vippsAuth.login();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Innloggingsfeil', error.message);
    }
  };

  const handleEmailLogin = async () => {
    const emailClean = email.trim();
    const passwordClean = password;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailClean,
      password: passwordClean,
    });

    if (error) {
      // Log detailed error info for diagnostics
      console.warn('Supabase signIn error', {
        name: (error as any).name,
        message: error.message,
        status: (error as any).status,
      });

      const raw = error.message || 'Ukjent feil';
      const lower = raw.toLowerCase();

      let friendly = 'En feil oppstod under innlogging.';
      if (lower.includes('invalid login credentials')) {
        friendly = 'Feil e-post eller passord.';
      } else if (lower.includes('email') && lower.includes('confirm')) {
        friendly = 'E-posten er ikke bekreftet ennå. Sjekk innboksen (og spam).';
      } else if (lower.includes('network') || lower.includes('fetch')) {
        friendly = 'Ingen nettverkstilkobling. Prøv igjen senere.';
      } else if (lower.includes('rate') && lower.includes('limit')) {
        friendly = 'For mange forsøk. Vent litt og prøv igjen.';
      }

      const hint = '\n\nTips:\n• Sjekk at e-post og passord er riktig.\n• Hvis du nettopp registrerte deg, bekreft e-posten via lenken.\n• Om problemet vedvarer, kjør scripts/create-quick-test-user.js for å verifisere innlogging mot samme prosjekt.';
      Alert.alert('Innloggingsfeil', `${friendly}\n\n(Detaljer: ${raw})${hint}`);
      return;
    }

    // Success
    router.replace('/(tabs)' as any);
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handleSkip = () => {
    setShowOnboarding(false);
  };

  const handleNext = () => {
    if (currentSlideIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentSlideIndex + 1 });
    } else {
      setShowOnboarding(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentSlideIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderOnboardingSlide = ({ item }: { item: typeof ONBOARDING_SLIDES[0] }) => (
    <View style={[styles.slideContainer, { width }]}>
      <View style={styles.illustration}>
        <FontAwesome name={item.icon as any} size={80} color={Colors.light.tint} />
      </View>
      <Text style={[styles.title, { color: '#111' }]}>{item.title}</Text>
      <Text style={[styles.subtitle, { color: '#444', textAlign: 'center', paddingHorizontal: 40 }]}>
        {item.description}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ThemedView style={styles.container}>
      {showOnboarding ? (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={[styles.skipButton, { top: 12 }]} onPress={handleSkip}>
            <Text style={styles.skipText}>Hopp over</Text>
          </TouchableOpacity>

          <FlatList
            ref={flatListRef}
            data={ONBOARDING_SLIDES}
            renderItem={renderOnboardingSlide}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20 }}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />

          <View style={[styles.buttonContainer, { bottom: insets.bottom + 16 }]}> 
            <View style={[styles.pagination, { marginBottom: 12 }]}> 
              {ONBOARDING_SLIDES.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentSlideIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity
              style={[styles.button, { borderRadius: 24 }]}
              onPress={handleNext}
            >
              <Text style={styles.buttonText}>
                {currentSlideIndex === ONBOARDING_SLIDES.length - 1 ? 'Kom i gang' : 'Neste'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRegister}>
              <Text style={[styles.linkText, { color: Colors.light.tint }]}>Opprett konto</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View>
            <Text style={[styles.formTitle]}>Login</Text>
            <Text style={[styles.formSubtitle]}>Welcome back to the app</Text>

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={[styles.inputLight]}
              placeholder="hello@example.com"
              placeholderTextColor="#9AA0A6"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.inputLabel}>Password</Text>
              <TouchableOpacity
                onPress={async () => {
                  const emailClean = email.trim();
                  if (!emailClean) {
                    Alert.alert('Forgot Password', 'Enter your email first to receive a reset link.');
                    return;
                  }
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(emailClean, {
                      redirectTo: 'fortgjort://reset-password',
                    });
                    if (error) throw error;
                    Alert.alert('Reset link sent', 'Check your inbox for a link to reset your password.');
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Unknown error';
                    Alert.alert('Could not send reset link', msg);
                  }
                }}
              > 
                <Text style={[styles.smallLink, { color: Colors.light.tint }]}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputPasswordWrapper}>
              <TextInput
                style={[styles.inputLight]}
                placeholder="••••••••"
                placeholderTextColor="#9AA0A6"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword((v) => !v)}>
                <FontAwesome name={showPassword ? 'eye' : 'eye-slash'} size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.checkboxRow}>
              <Switch value={keepSignedIn} onValueChange={setKeepSignedIn} trackColor={{ false: '#E5E7EB', true: Colors.light.tint }} />
              <Text style={styles.checkboxLabel}>Keep me signed in</Text>
            </View>

            <TouchableOpacity style={[styles.button, { borderRadius: 24 }]} onPress={handleEmailLogin}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ alignSelf: 'center', marginTop: 8 }}
              onPress={async () => {
                const emailClean = email.trim();
                if (!emailClean) {
                  Alert.alert('Resend confirmation', 'Enter your email first to receive a confirmation email.');
                  return;
                }
                try {
                  const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: emailClean,
                    options: {
                      emailRedirectTo: 'fortgjort://login',
                    },
                  });
                  if (error) throw error;
                  Alert.alert('Confirmation sent', 'We re-sent the confirmation email. Please check your inbox.');
                } catch (e) {
                  const msg = e instanceof Error ? e.message : 'Unknown error';
                  Alert.alert('Could not resend confirmation', msg);
                }
              }}
            >
              <Text style={[styles.smallLink, { color: Colors.light.tint }]}>Resend confirmation email</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or sign in with</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.socialButton} onPress={handleVippsLogin}>
              <FontAwesome name="credit-card" size={16} color="#111" style={{ marginRight: 8 }} />
              <Text style={styles.socialText}>Continue with Vipps</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.bottomRegister, { marginBottom: insets.bottom + 16 }]}>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={[styles.linkText, { color: Colors.light.tint }]}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    marginTop: '20%',
    marginBottom: 40,
  },
  illustration: {
    width: 220,
    height: 160,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#1E1E1E',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 24,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '600',
  },
  inputLight: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    width: '100%',
    backgroundColor: '#FFFFFF',
    color: '#111111',
  },
  inputPasswordWrapper: {
    position: 'relative',
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkboxLabel: {
    marginLeft: 8,
    color: '#374151',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 8,
    color: '#6B7280',
  },
  smallLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 12,
  },
  socialText: {
    color: '#111',
    fontWeight: '600',
  },
  bottomRegister: {
    alignItems: 'center',
    marginBottom: 24,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: Colors.light.tint,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 10,
  },
  actionCard: {
    width: '45%',
    aspectRatio: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
  },
  actionIcon: {
    marginBottom: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 16,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    width: '100%',
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
  },
});

