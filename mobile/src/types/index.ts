export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  rating?: number;
  badges?: string[];
}

export interface CardIdentificationResult {
  matchId: string;
  cardId: string;
  name: string;
  game: string;
  edition: string;
  variant?: string | null;
  year?: number;
  setNumber?: string;
  imageUrl?: string;
  estimatedValue?: {
    average: number;
    lowest: number;
    highest: number;
  } | null;
}

export interface ValuationPoint {
  date: string;
  average: number;
  lowest: number;
  highest: number;
  volume: number;
}

export interface Valuation {
  card: {
    id: string;
    name: string;
    game: string;
    edition: string;
    variant?: string;
    year?: number;
    setNumber?: string;
    imageUrl?: string;
  } | null;
  history: ValuationPoint[];
  average: number | null;
  lowest: number | null;
  highest: number | null;
  change30d: number | null;
  change7d: number | null;
  average7d: number | null;
  average30d: number | null;
  volume30d: number | null;
  sources?: Array<{
    provider: string;
    url: string;
    confidence?: number;
  }>;
}

export interface Listing {
  id: string;
  cardId: string;
  sellerId: string;
  price: number;
  currency: string;
  condition: string;
  description: string;
  photos: string[];
  status: 'active' | 'sold' | 'archived';
  createdAt: string;
  updatedAt: string;
  card?: {
    id: string;
    name: string;
    game: string;
    edition: string;
    variant?: string | null;
    year?: number;
    setNumber?: string;
    imageUrl?: string;
  } | null;
  valuation?: Valuation | null;
}

export interface ForumCategory {
  id: string;
  title: string;
  description: string;
}

export interface ForumReply {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  categoryId: string;
  authorId: string;
  title: string;
  content: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  replies: ForumReply[];
}

export interface MessageThread {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  createdAt: string;
  updatedAt?: string;
  messages: Array<{
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
  }>;
  listing?: Listing | null;
}
