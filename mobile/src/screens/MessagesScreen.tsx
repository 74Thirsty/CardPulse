import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createThread, fetchThreads, sendMessage } from '../services/api';
import type { MessageThread } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function MessagesScreen() {
  const { token, user } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [creatingThread, setCreatingThread] = useState(false);
  const [sellerId, setSellerId] = useState('user-demo-1');
  const [listingId, setListingId] = useState('listing-1');
  const [newThreadMessage, setNewThreadMessage] = useState('Interested! Is this still available?');

  const loadThreads = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetchThreads(token);
      setThreads(response.threads);
    } catch (error) {
      Alert.alert('Failed to load messages', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? threads[0] ?? null,
    [selectedThreadId, threads],
  );

  useEffect(() => {
    if (!selectedThreadId && threads.length > 0) {
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId]);

  const handleSend = async () => {
    if (!token || !selectedThread) {
      return;
    }
    if (!replyMessage.trim()) {
      return;
    }
    try {
      await sendMessage(selectedThread.id, { content: replyMessage.trim() }, token);
      setReplyMessage('');
      await loadThreads();
    } catch (error) {
      Alert.alert('Failed to send message', (error as Error).message);
    }
  };

  const handleCreateThread = async () => {
    if (!token) {
      Alert.alert('Sign in required', 'Log in to negotiate deals.');
      return;
    }
    setCreatingThread(true);
    try {
      const response = await createThread({ sellerId, listingId, message: newThreadMessage }, token);
      setSelectedThreadId(response.thread.id);
      setNewThreadMessage('Interested! Is this still available?');
      await loadThreads();
    } catch (error) {
      Alert.alert('Failed to create thread', (error as Error).message);
    } finally {
      setCreatingThread(false);
    }
  };

  if (!user || !token) {
    return (
      <View style={styles.unauthenticated}>
        <Text style={styles.unauthenticatedText}>Sign in to view private negotiation threads.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <FlatList
          data={threads}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadThreads} tintColor="#38bdf8" />}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.threadButton, item.id === selectedThread?.id && styles.threadButtonActive]}
              onPress={() => setSelectedThreadId(item.id)}
            >
              <Text
                style={[styles.threadText, item.id === selectedThread?.id && styles.threadTextActive]}
                numberOfLines={2}
              >
                Listing {item.listingId}
              </Text>
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            <View style={styles.newThread}>
              <Text style={styles.sectionTitle}>Start new thread</Text>
              <TextInput style={styles.input} value={sellerId} onChangeText={setSellerId} placeholder="Seller ID" />
              <TextInput style={styles.input} value={listingId} onChangeText={setListingId} placeholder="Listing ID" />
              <TextInput
                style={[styles.input, styles.inputMessage]}
                value={newThreadMessage}
                onChangeText={setNewThreadMessage}
                placeholder="Message"
              />
              <Button
                title={creatingThread ? 'Sending…' : 'Message seller'}
                onPress={handleCreateThread}
                disabled={creatingThread}
              />
            </View>
          }
        />
      </View>
      <View style={styles.threadPane}>
        {selectedThread ? (
          <View style={styles.threadContent}>
            <Text style={styles.threadHeading}>Conversation</Text>
            <View style={styles.messages}>
              {selectedThread.messages.map((item) => (
                <View
                  key={item.id}
                  style={[styles.messageBubble, item.senderId === user.id ? styles.messageOwn : styles.messageOther]}
                >
                  <Text style={styles.messageText}>{item.content}</Text>
                  <Text style={styles.messageMeta}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
                </View>
              ))}
            </View>
            <View style={styles.composer}>
              <TextInput
                style={[styles.input, styles.inputMessage]}
                value={replyMessage}
                onChangeText={setReplyMessage}
                placeholder="Reply to seller"
              />
              <Button title="Send" onPress={handleSend} />
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Select a thread to view details.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#020617',
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
  sidebar: {
    width: 260,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  newThread: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#f8fafc',
  },
  inputMessage: {
    height: 80,
    textAlignVertical: 'top',
  },
  threadButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e293b',
  },
  threadButtonActive: {
    backgroundColor: '#1e293b',
  },
  threadText: {
    color: '#94a3b8',
  },
  threadTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  threadPane: {
    flex: 1,
  },
  threadContent: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  threadHeading: {
    fontSize: 20,
    color: '#f8fafc',
    fontWeight: '700',
  },
  messages: {
    flex: 1,
    gap: 12,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  messageOwn: {
    alignSelf: 'flex-end',
    backgroundColor: '#38bdf8',
  },
  messageOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
  },
  messageText: {
    color: '#f8fafc',
  },
  messageMeta: {
    marginTop: 4,
    color: '#cbd5f5',
    fontSize: 12,
  },
  composer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#94a3b8',
  },
});
