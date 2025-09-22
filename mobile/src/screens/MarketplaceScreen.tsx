import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import CardSummary from '../components/CardSummary';
import ValuationHistory from '../components/ValuationHistory';
import { createListing, fetchListings, fetchValuation } from '../services/api';
import type { Listing, Valuation } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ExtendedListing extends Listing {
  valuation?: Valuation | null;
}

export default function MarketplaceScreen() {
  const { token, user } = useAuth();
  const [listings, setListings] = useState<ExtendedListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [cardId, setCardId] = useState('card-pikachu-base');
  const [price, setPrice] = useState('35');
  const [condition, setCondition] = useState('Near Mint');
  const [description, setDescription] = useState('Sleeved since pack opening.');
  const [photoUrl, setPhotoUrl] = useState('https://images.pokemontcg.io/base1/58.png');

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchListings();
      const enriched = await Promise.all(
        response.listings.map(async (listing) => {
          if (listing.valuation) {
            return listing;
          }
          try {
            const valuation = await fetchValuation(listing.cardId);
            return { ...listing, valuation };
          } catch (error) {
            return { ...listing, valuation: null };
          }
        }),
      );
      setListings(enriched);
    } catch (error) {
      Alert.alert('Failed to load listings', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const canCreate = useMemo(() => Boolean(token && user), [token, user]);

  const submitListing = async () => {
    if (!token) {
      Alert.alert('Sign in required', 'Log in to create listings.');
      return;
    }
    setCreating(true);
    try {
      await createListing(
        {
          cardId,
          price: Number(price),
          currency: 'USD',
          condition,
          description,
          photos: [photoUrl],
        },
        token,
      );
      await loadListings();
      Alert.alert('Listing published', 'Your card is now live in the marketplace.');
    } catch (error) {
      Alert.alert('Failed to create listing', (error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadListings} tintColor="#38bdf8" />}>
      <View style={styles.content}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>Discover live listings, pricing insights, and seller credibility.</Text>

        {canCreate ? (
          <View style={styles.createCard}>
            <Text style={styles.sectionTitle}>Create a listing</Text>
            <TextInput style={styles.input} value={cardId} onChangeText={setCardId} placeholder="Card identifier" />
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder="Price"
            />
            <TextInput
              style={styles.input}
              value={condition}
              onChangeText={setCondition}
              placeholder="Condition"
            />
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
            />
            <TextInput
              style={styles.input}
              value={photoUrl}
              onChangeText={setPhotoUrl}
              placeholder="Photo URL"
            />
            <Button title={creating ? 'Publishing…' : 'Publish listing'} onPress={submitListing} disabled={creating} />
          </View>
        ) : (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>Sign in to publish your cards to the marketplace.</Text>
          </View>
        )}

        <View style={styles.listings}>
          {listings.map((listing) => {
            const card = listing.card ?? listing.valuation?.card;
            return (
            <View key={listing.id} style={styles.listingCard}>
              <Text style={styles.listingHeader}>
                ${listing.price.toFixed(2)} · {listing.condition}
              </Text>
              <CardSummary
                card={{
                  matchId: listing.id,
                  cardId: listing.cardId,
                  name: card?.name ?? listing.cardId,
                  game: card?.game ?? 'Unknown',
                  edition: card?.edition ?? '—',
                  variant: card?.variant,
                  year: card?.year,
                  setNumber: card?.setNumber,
                  imageUrl: card?.imageUrl,
                  estimatedValue: listing.valuation
                    ? {
                        average: listing.valuation.average ?? listing.price,
                        lowest: listing.valuation.lowest ?? listing.price,
                        highest: listing.valuation.highest ?? listing.price,
                      }
                    : null,
                }}
              />
              <Text style={styles.description}>{listing.description}</Text>
              {listing.valuation ? <ValuationHistory valuation={listing.valuation} /> : null}
            </View>
            );
          })}
        </View>
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
  createCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#f8fafc',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f8fafc',
  },
  notice: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0f172a',
  },
  noticeText: {
    color: '#94a3b8',
  },
  listings: {
    gap: 16,
  },
  listingCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    gap: 12,
  },
  listingHeader: {
    fontSize: 16,
    color: '#38bdf8',
    fontWeight: '700',
  },
  description: {
    color: '#94a3b8',
  },
});
