const crypto = require('crypto');

const users = [
  {
    id: 'user-demo-1',
    email: 'ash@cardpulse.app',
    displayName: 'Ash Collector',
    passwordHash: '',
    createdAt: new Date().toISOString(),
    rating: 4.8,
    badges: ['founder', 'trusted-seller'],
  },
];

const cards = [
  {
    id: 'card-pikachu-base',
    name: 'Pikachu',
    game: 'Pokémon',
    year: 1999,
    edition: 'Base Set',
    variant: 'Unlimited',
    setNumber: '58/102',
    imageUrl:
      'https://images.pokemontcg.io/base1/58_hires.png',
  },
  {
    id: 'card-charizard-holo',
    name: 'Charizard',
    game: 'Pokémon',
    year: 1999,
    edition: 'Base Set',
    variant: 'Holo',
    setNumber: '4/102',
    imageUrl:
      'https://images.pokemontcg.io/base1/4_hires.png',
  },
  {
    id: 'card-lebron-rc',
    name: 'LeBron James Rookie',
    game: 'NBA',
    year: 2003,
    edition: 'Topps Chrome',
    variant: 'Refractor',
    setNumber: '#111',
    imageUrl:
      'https://example.com/lebron-topps.png',
  },
  {
    id: 'card-jordan-fleer',
    name: 'Michael Jordan Rookie',
    game: 'NBA',
    year: 1986,
    edition: 'Fleer',
    variant: 'Base',
    setNumber: '57',
    imageUrl: 'https://example.com/jordan-fleer.png',
  },
  {
    id: 'card-brady-contenders',
    name: 'Tom Brady Rookie',
    game: 'NFL',
    year: 2000,
    edition: 'Playoff Contenders',
    variant: 'Autograph',
    setNumber: '144',
    imageUrl: 'https://example.com/brady-contenders.png',
  },
];

const valuations = {
  'card-pikachu-base': {
    history: generateHistory(30, 20, 45),
  },
  'card-charizard-holo': {
    history: generateHistory(30, 250, 450),
  },
  'card-lebron-rc': {
    history: generateHistory(30, 1200, 3000),
  },
  'card-jordan-fleer': {
    history: generateHistory(30, 15000, 32000),
  },
  'card-brady-contenders': {
    history: generateHistory(30, 18000, 50000),
  },
};

const listings = [
  {
    id: 'listing-1',
    cardId: 'card-pikachu-base',
    sellerId: 'user-demo-1',
    price: 35,
    currency: 'USD',
    condition: 'Near Mint',
    description: 'Pulled from a pack, stored sleeved. Includes penny sleeve.',
    photos: [
      'https://images.pokemontcg.io/base1/58.png',
    ],
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'listing-2',
    cardId: 'card-charizard-holo',
    sellerId: 'user-demo-1',
    price: 425,
    currency: 'USD',
    condition: 'Lightly Played',
    description: 'Comes with certificate from PSA. Light surface scratches.',
    photos: [
      'https://images.pokemontcg.io/base1/4.png',
    ],
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const forumCategories = [
  {
    id: 'category-sale',
    title: 'For Sale',
    description: 'List cards that you are ready to move today.',
  },
  {
    id: 'category-wanted',
    title: 'Wanted',
    description: 'Looking to buy a specific card? Post the details here.',
  },
  {
    id: 'category-trade',
    title: 'Trade',
    description: 'Set up trade offers with the community.',
  },
  {
    id: 'category-discussion',
    title: 'General Discussion',
    description: 'Talk strategy, grading, and hobby news.',
  },
];

const forumPosts = [
  {
    id: 'post-1',
    categoryId: 'category-sale',
    authorId: 'user-demo-1',
    title: 'Selling PSA 8 Charizard Holo',
    content:
      'Freshly graded, comes with certification. Looking for serious offers only.',
    attachments: [
      'https://images.pokemontcg.io/base1/4_hires.png',
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    replies: [
      {
        id: 'reply-1',
        authorId: 'user-demo-1',
        content: 'Price drop to $400 shipped with insurance.',
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
    ],
  },
];

const messageThreads = [
  {
    id: 'thread-1',
    buyerId: 'user-demo-1',
    sellerId: 'user-demo-1',
    listingId: 'listing-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    messages: [
      {
        id: 'msg-1',
        senderId: 'user-demo-1',
        content: 'Is the card still available? Interested in buying today.',
        createdAt: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
      },
      {
        id: 'msg-2',
        senderId: 'user-demo-1',
        content: 'Yes, it is available. Happy to answer any questions.',
        createdAt: new Date(Date.now() - 1000 * 60 * 27).toISOString(),
      },
    ],
  },
];

function generateHistory(days, min, max) {
  const history = [];
  let current = randomBetween(min, max);
  for (let i = days; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    current = constrain(
      current + randomBetween(-0.1 * current, 0.1 * current),
      min,
      max,
    );
    history.push({
      date: date.toISOString().split('T')[0],
      average: Number(current.toFixed(2)),
      lowest: Number((current * 0.85).toFixed(2)),
      highest: Number((current * 1.15).toFixed(2)),
      volume: Math.floor(randomBetween(5, 60)),
    });
  }
  return history;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function constrain(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function bootstrapPassword() {
  const password = 'password123';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 15000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

users[0].passwordHash = bootstrapPassword();

module.exports = {
  users,
  cards,
  valuations,
  listings,
  forumCategories,
  forumPosts,
  messageThreads,
};
