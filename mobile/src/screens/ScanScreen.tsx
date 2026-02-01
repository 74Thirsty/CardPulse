import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import CardSummary from '../components/CardSummary';
import ValuationHistory from '../components/ValuationHistory';
import { identifyCard, fetchValuation } from '../services/api';
import type { CardIdentificationResult, Valuation } from '../types';

export default function ScanScreen() {
  const [manualQuery, setManualQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [card, setCard] = useState<CardIdentificationResult | null>(null);
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [loading, setLoading] = useState(false);

  const pickCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission denied');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.3,
      base64: true,
    });
    await handleImageResult(result);
  };

  const pickLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Library permission denied');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.3,
      base64: true,
    });
    await handleImageResult(result);
  };

  const handleImageResult = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedImage(asset.uri);
      const placeholderText = [asset.fileName, manualQuery].filter(Boolean).join(' ');
      await identify(placeholderText || '');
    }
  };

  const identify = async (imageText: string) => {
    setLoading(true);
    try {
      const { result } = await identifyCard({ imageText });
      setCard(result);
      const valuationResponse = await fetchValuation(result.cardId);
      setValuation(valuationResponse);
    } catch (error) {
      Alert.alert('Identification failed', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Scan a card</Text>
      <Text style={styles.subtitle}>
        Use your device camera, gallery, or describe the card manually to identify and assess real-time value.
      </Text>
      <View style={styles.actions}>
        <Button title="Open camera" onPress={pickCamera} />
        <Button title="Choose from gallery" onPress={pickLibrary} />
        <Text style={styles.or}>or</Text>
        <TextInput
          style={styles.input}
          placeholder="Search for Pikachu Base Set…"
          placeholderTextColor="#64748b"
          value={manualQuery}
          onChangeText={setManualQuery}
        />
        <Button title="Identify" onPress={() => identify(manualQuery)} disabled={loading} />
      </View>
      {selectedImage ? <Image source={{ uri: selectedImage }} style={styles.preview} /> : null}
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} /> : null}
      {card ? (
        <View style={styles.result}>
          <CardSummary card={card} />
          {valuation ? <ValuationHistory valuation={valuation} /> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    color: '#94a3b8',
  },
  actions: {
    gap: 12,
  },
  or: {
    textAlign: 'center',
    color: '#475569',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f8fafc',
  },
  preview: {
    marginTop: 12,
    width: '100%',
    height: 220,
    borderRadius: 16,
  },
  result: {
    marginTop: 16,
    gap: 16,
  },
});
