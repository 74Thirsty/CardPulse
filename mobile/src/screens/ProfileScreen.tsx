import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { fetchListings } from '../services/api';
import type { Listing } from '../types';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const loadListings = async () => {
      try {
        const response = await fetchListings();
        if (user) {
          setListings(response.listings.filter((listing) => listing.sellerId === user.id));
        }
      } catch (error) {
        Alert.alert('Failed to load listings', (error as Error).message);
      }
    };
    loadListings();
  }, [user]);

  if (!user) {
    return (
      <View style={styles.unauthenticated}>
        <Text style={styles.unauthenticatedText}>Sign in to access your CardPulse profile.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.name}>{user.displayName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.meta}>Member since {new Date(user.createdAt).toLocaleDateString()}</Text>
        {user.rating ? <Text style={styles.meta}>Rating: {user.rating.toFixed(1)} ⭐️</Text> : null}
        {user.badges ? (
          <View style={styles.badges}>
            {user.badges.map((badge) => (
              <View key={badge} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <Button title="Log out" onPress={logout} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active listings</Text>
        {listings.length === 0 ? (
          <Text style={styles.empty}>No active listings yet. Publish a card from the marketplace tab.</Text>
        ) : (
          listings.map((listing) => (
            <View key={listing.id} style={styles.listing}>
              <Text style={styles.listingTitle}>${listing.price.toFixed(2)} · {listing.condition}</Text>
              <Text style={styles.listingMeta}>Card ID {listing.cardId}</Text>
              <Text style={styles.listingMeta}>Status: {listing.status}</Text>
            </View>
          ))
        )}
      </View>
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
    gap: 24,
  },
  header: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    gap: 12,
  },
  name: {
    fontSize: 28,
    color: '#f8fafc',
    fontWeight: '700',
  },
  email: {
    color: '#94a3b8',
  },
  meta: {
    color: '#cbd5f5',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#38bdf8',
  },
  badgeText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  section: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#f8fafc',
    fontWeight: '700',
  },
  empty: {
    color: '#94a3b8',
  },
  listing: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    gap: 4,
  },
  listingTitle: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  listingMeta: {
    color: '#cbd5f5',
  },
  unauthenticated: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
    padding: 24,
  },
  unauthenticatedText: {
    color: '#94a3b8',
    textAlign: 'center',
  },
});
