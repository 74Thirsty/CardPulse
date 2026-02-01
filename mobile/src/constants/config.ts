import Constants from 'expo-constants';
import { Platform } from 'react-native';

const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

function resolveHostFromExpo(): string | null {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest?.hostUri;
  if (!hostUri) {
    return null;
  }
  return hostUri.split(':')[0] ?? null;
}

function resolveFallbackBaseUrl(): string {
  const host = resolveHostFromExpo();
  if (host) {
    if (host === 'localhost' || host === '127.0.0.1') {
      return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
    }
    return `http://${host}:4000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
}

export const API_BASE_URL = envBaseUrl ?? resolveFallbackBaseUrl();
