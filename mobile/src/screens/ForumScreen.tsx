import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchForumCategories, fetchForumPosts, createForumPost } from '../services/api';
import type { ForumCategory, ForumPost } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function ForumScreen() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetchForumCategories();
      setCategories(response.categories);
    } catch (error) {
      Alert.alert('Failed to fetch categories', (error as Error).message);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const response = await fetchForumPosts(selectedCategory);
      setPosts(response.posts);
    } catch (error) {
      Alert.alert('Failed to fetch posts', (error as Error).message);
    } finally {
      setLoadingPosts(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const submitPost = async () => {
    if (!token) {
      Alert.alert('Sign in required', 'Log in to contribute to the forum.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Select a category', 'Choose where to publish your post.');
      return;
    }
    setCreating(true);
    try {
      await createForumPost(
        {
          categoryId: selectedCategory,
          title,
          content,
          attachments: [],
        },
        token,
      );
      setTitle('');
      setContent('');
      await loadPosts();
    } catch (error) {
      Alert.alert('Failed to create post', (error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const selectedCategoryMeta = useMemo(
    () => categories.find((category) => category.id === selectedCategory),
    [categories, selectedCategory],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Community forum</Text>
      <Text style={styles.subtitle}>Coordinate trades, share insights, and stay up-to-date on market moves.</Text>
      <View style={styles.categories}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.category, selectedCategory === category.id && styles.categoryActive]}
            onPress={() => setSelectedCategory((current) => (current === category.id ? undefined : category.id))}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive,
              ]}
            >
              {category.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedCategoryMeta ? (
        <View style={styles.categoryDescription}>
          <Text style={styles.categoryDescriptionText}>{selectedCategoryMeta.description}</Text>
        </View>
      ) : null}

      {token && selectedCategory ? (
        <View style={styles.compose}>
          <Text style={styles.sectionTitle}>Compose post</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" />
          <TextInput
            style={[styles.input, styles.multiline]}
            value={content}
            onChangeText={setContent}
            placeholder="Share your insight…"
            multiline
            numberOfLines={4}
          />
          <Button title={creating ? 'Posting…' : 'Publish'} onPress={submitPost} disabled={creating} />
        </View>
      ) : null}

      <View style={styles.posts}>
        {loadingPosts ? (
          <Text style={styles.loading}>Loading posts…</Text>
        ) : posts.length === 0 ? (
          <Text style={styles.empty}>No posts yet. Be the first to start the conversation!</Text>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postMeta}>{new Date(post.createdAt).toLocaleString()}</Text>
              <Text style={styles.postContent}>{post.content}</Text>
              <View style={styles.replyContainer}>
                {post.replies.map((reply) => (
                  <Text key={reply.id} style={styles.replyText}>
                    {reply.content}
                  </Text>
                ))}
              </View>
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
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  category: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#0f172a',
  },
  categoryActive: {
    backgroundColor: '#38bdf8',
  },
  categoryText: {
    color: '#cbd5f5',
  },
  categoryTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  categoryDescription: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0f172a',
  },
  categoryDescriptionText: {
    color: '#94a3b8',
  },
  compose: {
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
  multiline: {
    height: 120,
    textAlignVertical: 'top',
  },
  posts: {
    gap: 16,
  },
  loading: {
    color: '#94a3b8',
  },
  empty: {
    color: '#94a3b8',
  },
  postCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    gap: 8,
  },
  postTitle: {
    fontSize: 18,
    color: '#f8fafc',
    fontWeight: '700',
  },
  postMeta: {
    color: '#64748b',
    fontSize: 12,
  },
  postContent: {
    color: '#e2e8f0',
  },
  replyContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    gap: 6,
  },
  replyText: {
    color: '#cbd5f5',
  },
});
