import { API_BASE_URL } from '../constants/config';
import type { CardIdentificationResult, Listing, Valuation, ForumPost, ForumCategory, MessageThread, UserProfile } from '../types';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  token?: string | null;
  timeoutMs?: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'UNKNOWN_ERROR' }));
      throw new Error(error.error || 'Request failed');
    }
    return (await response.json()) as T;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error('Request timed out. Check your connection and try again.');
    }
    if (error instanceof TypeError) {
      throw new Error('Network request failed. Verify the API server is reachable.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function register(payload: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ user: UserProfile }> {
  return request('/api/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<{ token: string; user: UserProfile }> {
  return request('/api/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export async function identifyCard(payload: {
  imageText?: string;
  hints?: string[];
}): Promise<{ result: CardIdentificationResult }> {
  return request('/api/cards/identify', {
    method: 'POST',
    body: payload,
  });
}

export async function fetchValuation(cardId: string): Promise<Valuation> {
  return request(`/api/cards/${cardId}/valuation`);
}

export async function searchCards(query: string): Promise<{ results: CardIdentificationResult[] }> {
  const encoded = encodeURIComponent(query);
  return request(`/api/cards/search?q=${encoded}`);
}

export async function fetchListings(): Promise<{ listings: Listing[] }> {
  return request('/api/marketplace/listings');
}

export async function createListing(payload: Omit<Listing, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'sellerId'>, token: string): Promise<{ listing: Listing }> {
  return request('/api/marketplace/listings', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function updateListing(
  id: string,
  payload: Partial<Pick<Listing, 'status' | 'price'>>,
  token: string,
): Promise<{ listing: Listing }> {
  return request(`/api/marketplace/listings/${id}`, {
    method: 'PATCH',
    body: payload,
    token,
  });
}

export async function fetchForumCategories(): Promise<{ categories: ForumCategory[] }> {
  return request('/api/forum/categories');
}

export async function fetchForumPosts(categoryId?: string): Promise<{ posts: ForumPost[] }> {
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
  return request(`/api/forum/posts${query}`);
}

export async function createForumPost(
  payload: Pick<ForumPost, 'categoryId' | 'title' | 'content' | 'attachments'>,
  token: string,
): Promise<{ post: ForumPost }> {
  return request('/api/forum/posts', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function fetchThreads(token: string): Promise<{ threads: MessageThread[] }> {
  return request('/api/messages/threads', { token });
}

export async function createThread(
  payload: { sellerId: string; listingId: string; message?: string },
  token: string,
): Promise<{ thread: MessageThread }> {
  return request('/api/messages/threads', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function sendMessage(
  threadId: string,
  payload: { content: string },
  token: string,
): Promise<{ message: MessageThread['messages'][number] }> {
  return request(`/api/messages/threads/${threadId}/messages`, {
    method: 'POST',
    body: payload,
    token,
  });
}
