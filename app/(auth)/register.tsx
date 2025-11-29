import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/themed-text';
import Colors from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

export default function Register() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Feil', 'Passordene matcher ikke');
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
          },
        },
      });

      if (error) throw error;

      Alert.alert(
        'Registrering vellykket',
        'Sjekk e-posten din for å bekrefte kontoen.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Registreringsfeil', error.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView 
        contentContainerStyle={[styles.container, { paddingTop: 16, paddingBottom: insets.bottom + 24 }]} 
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.title}>Registrer ny bruker</Text>

      <TextInput
        style={styles.input}
        placeholder="Navn"
        placeholderTextColor="#9AA0A6"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="E-post"
        placeholderTextColor="#9AA0A6"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Telefon"
        placeholderTextColor="#9AA0A6"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Passord"
        placeholderTextColor="#9AA0A6"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Bekreft passord"
        placeholderTextColor="#9AA0A6"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={[styles.button, styles.registerButton]} 
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>Registrer</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.cancelButton]} 
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Avbryt</Text>
      </TouchableOpacity>

      <Text style={styles.terms}>
        Ved å registrere deg godtar du våre vilkår og betingelser, 
        samt at vi kan sende deg viktige oppdateringer på e-post.
      </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    color: '#111111',
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: Colors.light.primary,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  terms: {
    marginTop: 20,
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
});