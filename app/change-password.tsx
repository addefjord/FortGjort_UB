import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/themed-text';
import Colors from '../constants/Colors';
import { getPasswordRequirementStatus, validatePassword } from '../lib/password-policy';
import { supabase } from '../lib/supabase';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Feil', 'Vennligst fyll ut alle feltene');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Feil', 'De nye passordene matcher ikke');
      return;
    }

    // Validate new password policy
    const { valid, failedRequirements } = validatePassword(newPassword);
    if (!valid) {
      Alert.alert(
        'Svakt passord',
        `Det nye passordet må oppfylle følgende krav:\n${failedRequirements.map((r) => `• ${r.label}`).join('\n')}`
      );
      return;
    }

    try {
      setLoading(true);

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Alert.alert(
        'Suksess',
        'Passordet ditt har blitt endret',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Feil', error.message || 'Kunne ikke endre passord');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="chevron-left" size={18} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Endre passord</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <Text style={styles.label}>Nåværende passord</Text>
            <TextInput
              style={styles.input}
              placeholder="Skriv inn nåværende passord"
              placeholderTextColor="#9AA0A6"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={[styles.label, { marginTop: 20 }]}>Nytt passord</Text>
            <TextInput
              style={styles.input}
              placeholder="Skriv inn nytt passord"
              placeholderTextColor="#9AA0A6"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {newPassword.length > 0 && (
              <View style={styles.requirementsBox}>
                <Text style={styles.requirementsTitle}>Passordkrav:</Text>
                {getPasswordRequirementStatus(newPassword).map(({ requirement, passed }) => (
                  <View key={requirement.id} style={styles.requirementRow}>
                    <FontAwesome 
                      name={passed ? 'check-circle' : 'circle-o'} 
                      size={16} 
                      color={passed ? Colors.light.tint : '#999'} 
                    />
                    <Text style={[styles.requirementText, passed && styles.requirementTextPassed]}>
                      {requirement.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={[styles.label, { marginTop: 20 }]}>Bekreft nytt passord</Text>
            <TextInput
              style={styles.input}
              placeholder="Skriv inn nytt passord på nytt"
              placeholderTextColor="#9AA0A6"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleChangePassword}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Endrer...' : 'Endre passord'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
    color: '#111111',
    fontSize: 16,
  },
  requirementsBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  requirementText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#666',
  },
  requirementTextPassed: {
    color: Colors.light.tint,
  },
  button: {
    width: '100%',
    backgroundColor: Colors.light.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
