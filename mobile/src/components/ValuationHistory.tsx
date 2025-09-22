import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { Valuation } from '../types';

interface Props {
  valuation: Valuation;
}

export default function ValuationHistory({ valuation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>30 day performance</Text>
      <View style={styles.statsRow}>
        <Stat label="Average" value={valuation.average ? `$${valuation.average.toFixed(2)}` : 'N/A'} />
        <Stat label="Lowest" value={valuation.lowest ? `$${valuation.lowest.toFixed(2)}` : 'N/A'} />
        <Stat label="Highest" value={valuation.highest ? `$${valuation.highest.toFixed(2)}` : 'N/A'} />
        <Stat
          label="Change"
          value={
            valuation.change30d !== null
              ? `${valuation.change30d > 0 ? '+' : ''}${valuation.change30d}%`
              : 'N/A'
          }
        />
      </View>
      <FlatList
        data={[...valuation.history].reverse()}
        keyExtractor={(item) => item.date}
        style={styles.list}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowDate}>{item.date}</Text>
            <Text style={styles.rowValue}>${item.average.toFixed(2)}</Text>
            <Text style={styles.rowSmall}>Low ${item.lowest.toFixed(2)}</Text>
            <Text style={styles.rowSmall}>High ${item.highest.toFixed(2)}</Text>
          </View>
        )}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stat: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    maxHeight: 220,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowDate: {
    color: '#cbd5f5',
    flex: 1,
  },
  rowValue: {
    color: '#f8fafc',
    width: 100,
    textAlign: 'right',
  },
  rowSmall: {
    color: '#94a3b8',
    width: 110,
    textAlign: 'right',
  },
});
