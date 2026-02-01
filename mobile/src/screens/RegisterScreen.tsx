import React, { useState } from 'react';
import { Alert, Button, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import type { AuthStackParamList } from '../navigation/RootNavigator';

export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('New Collector');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await register(email.trim(), password, displayName.trim());
    } catch (error) {
      Alert.alert('Registration failed', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create an account</Text>
        <Text style={styles.subtitle}>Set up your CardPulse profile to start scanning cards.</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Display Name</Text>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
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
        <Button title={loading ? 'Creating…' : 'Create account'} onPress={handleSubmit} disabled={loading} />
        <TouchableOpacity style={styles.register} onPress={() => navigation.goBack()}>
          <Text style={styles.registerText}>Already registered? Sign in</Text>
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
    fontSize: 32,
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
