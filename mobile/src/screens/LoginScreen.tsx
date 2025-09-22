import React, { useState } from 'react';
import { Alert, Button, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import type { AuthStackParamList } from '../navigation/RootNavigator';

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('ash@cardpulse.app');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      Alert.alert('Login failed', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CardPulse</Text>
        <Text style={styles.subtitle}>Authenticate to manage your collection and trades.</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Button title={loading ? 'Signing in…' : 'Sign in'} onPress={handleSubmit} disabled={loading} />
        <TouchableOpacity style={styles.register} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>Need an account? Create one</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#0f172a',
  },
  header: {
    marginTop: 48,
  },
  title: {
    fontSize: 42,
    color: '#f8fafc',
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    color: '#cbd5f5',
    fontSize: 16,
  },
  form: {
    marginTop: 48,
    gap: 12,
  },
  label: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    color: '#f8fafc',
  },
  register: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    color: '#38bdf8',
    fontWeight: '600',
  },
});
