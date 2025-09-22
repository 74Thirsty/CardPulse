import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { CardIdentificationResult } from '../types';

interface Props {
  card: CardIdentificationResult;
}

export default function CardSummary({ card }: Props) {
  return (
    <View style={styles.container}>
      {card.imageUrl ? <Image source={{ uri: card.imageUrl }} style={styles.image} /> : null}
      <View style={styles.content}>
        <Text style={styles.title}>{card.name}</Text>
        <Text style={styles.subtitle}>{card.game}</Text>
        <Text style={styles.meta}>
          {card.year ? `${card.year} · ` : ''}
          {card.edition}
          {card.variant ? ` · ${card.variant}` : ''}
        </Text>
        {card.estimatedValue ? (
          <View style={styles.values}>
            <Text style={styles.value}>Avg ${card.estimatedValue.average.toFixed(2)}</Text>
            <Text style={styles.valueSmall}>Low ${card.estimatedValue.lowest.toFixed(2)}</Text>
            <Text style={styles.valueSmall}>High ${card.estimatedValue.highest.toFixed(2)}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0f172a',
  },
  image: {
    width: 96,
    height: 136,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    color: '#cbd5f5',
  },
  meta: {
    color: '#94a3b8',
  },
  values: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  value: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#2563eb',
    color: '#f8fafc',
    fontWeight: '600',
  },
  valueSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#1e293b',
    color: '#cbd5f5',
    fontWeight: '600',
  },
});
